import { db } from "@workspace/db";
import {
  reservationsTable,
  productsTable,
  storesTable,
  conversationsTable,
  chatMessagesTable,
  reservationAuditLogTable,
  type ReservationStatus,
} from "@workspace/db/schema";
import { and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { createNotification } from "./notificationService";
import { logger } from "../lib/logger";

// ---------------------------------------------------------------------------
// Reservation Service — Sprint G.6
// ---------------------------------------------------------------------------
// Responsibilities:
//   • State machine with full lifecycle (pending → confirmed/declined/cancelled/
//     expired, confirmed → completed/cancelled)
//   • Atomic transactions with optimistic locking on every transition
//   • Idempotency: re-issuing a transition already in the target state returns
//     the current record instead of throwing
//   • Audit trail written inside the same transaction as the status update
//   • Expiration API consumed by the background worker
//   • History API for the reservation timeline endpoint
// ---------------------------------------------------------------------------

// ─── Custom error types ───────────────────────────────────────────────────────

export class ReservationNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReservationNotFoundError";
  }
}

export class ReservationConflictError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "ReservationConflictError";
    this.code = code;
  }
}

export class ReservationForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReservationForbiddenError";
  }
}

export class ReservationTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot transition reservation from '${from}' to '${to}'`);
    this.name = "ReservationTransitionError";
  }
}

// ─── State machine ────────────────────────────────────────────────────────────
//
// 'expired' is a system-only terminal state reached when a pending reservation
// passes its expiresAt deadline without merchant action.
// Exported for unit tests (pure domain rule).

export const ALLOWED_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  pending:   ["confirmed", "declined", "cancelled", "expired"],
  confirmed: ["completed", "cancelled"],
  declined:  [],
  cancelled: [],
  expired:   [],
  completed: [],
};

/** Assert that a status transition is allowed by the domain state machine. Exported for unit tests. */
export function assertTransition(from: string, to: ReservationStatus): void {
  const allowed = ALLOWED_TRANSITIONS[from as ReservationStatus] ?? [];
  if (!allowed.includes(to)) {
    throw new ReservationTransitionError(from, to);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultExpiresAt(): Date {
  return new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now
}

/**
 * Returns true when a DB error is a unique-constraint violation (PG code 23505).
 * Drizzle wraps the PG error in `_DrizzleQueryError`; the original PG error
 * lives in `err.cause.code`.
 * Exported for unit tests.
 */
export function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as Record<string, unknown>;

  if (e.code === "23505") return true;

  if (
    typeof e.cause === "object" &&
    e.cause !== null &&
    (e.cause as Record<string, unknown>).code === "23505"
  ) {
    return true;
  }

  if (typeof e.message === "string" && e.message.includes("unique constraint")) {
    return true;
  }

  return false;
}

// ─── DTO types ────────────────────────────────────────────────────────────────

type ReservationRow = typeof reservationsTable.$inferSelect;
type ProductRow     = typeof productsTable.$inferSelect;
type StoreRow       = typeof storesTable.$inferSelect;

export function toReservationDto(
  reservation: ReservationRow,
  product: ProductRow,
  store: StoreRow,
) {
  return {
    id: reservation.id,
    productId: reservation.productId,
    product: {
      nameAr:     product.nameAr,
      nameEn:     product.nameEn,
      price:      product.price,
      imageColor: product.imageColor,
      brand:      product.brand,
      model:      product.model,
    },
    storeId: reservation.storeId,
    store: {
      nameAr:      store.nameAr,
      nameEn:      store.nameEn,
      logoColor:   store.logoColor,
      logoInitial: store.logoInitial,
      address:     store.address,
      phone:       store.phone,
    },
    buyerId:        reservation.buyerId,
    conversationId: reservation.conversationId ?? null,
    status:         reservation.status,
    cancelledBy:    reservation.cancelledBy ?? null,
    buyerNotes:     reservation.buyerNotes ?? null,
    merchantNotes:  reservation.merchantNotes ?? null,
    expiresAt:    reservation.expiresAt.toISOString(),
    confirmedAt:  reservation.confirmedAt  ? reservation.confirmedAt.toISOString()  : null,
    declinedAt:   reservation.declinedAt   ? reservation.declinedAt.toISOString()   : null,
    cancelledAt:  reservation.cancelledAt  ? reservation.cancelledAt.toISOString()  : null,
    completedAt:  reservation.completedAt  ? reservation.completedAt.toISOString()  : null,
    expiredAt:    reservation.expiredAt    ? reservation.expiredAt.toISOString()    : null,
    createdAt:    reservation.createdAt.toISOString(),
    updatedAt:    reservation.updatedAt.toISOString(),
  };
}

// ─── Internal: optimised fetch with JOIN ──────────────────────────────────────
//
// Single round-trip to fetch the reservation with its product and store.

async function fetchWithContext(id: string) {
  const [row] = await db
    .select({
      reservation: reservationsTable,
      product:     productsTable,
      store:       storesTable,
    })
    .from(reservationsTable)
    .innerJoin(productsTable, eq(reservationsTable.productId, productsTable.id))
    .innerJoin(storesTable,   eq(reservationsTable.storeId,   storesTable.id))
    .where(eq(reservationsTable.id, id));

  return row ?? null;
}

// ─── Internal: write an audit log entry ───────────────────────────────────────
//
// Must be called inside an existing db.transaction() so that the audit row is
// atomically committed or rolled back with the status update.

type AuditInput = {
  tx:            Parameters<Parameters<typeof db.transaction>[0]>[0];
  reservationId: string;
  fromStatus:    string | null;
  toStatus:      string;
  actor:         string;
  actorType:     "buyer" | "merchant" | "system";
  reason?:       string;
  metadata?:     Record<string, unknown>;
};

async function writeAuditLog(input: AuditInput): Promise<void> {
  const { tx, reservationId, fromStatus, toStatus, actor, actorType, reason, metadata } = input;
  await tx.insert(reservationAuditLogTable).values({
    id:            generateId("aud"),
    reservationId,
    fromStatus,
    toStatus,
    actor,
    actorType,
    reason:        reason ?? null,
    metadata:      metadata ? JSON.stringify(metadata) : null,
    createdAt:     new Date(),
  });
}

// ─── Internal: create or reuse conversation + post system message ─────────────
//
// One conversation per (buyerId + storeId + productId) triple.

async function ensureConversationWithMessage(
  buyerId:        string,
  storeId:        string,
  productId:      string,
  productNameAr:  string,
  productNameEn:  string,
  systemContent:  string,
): Promise<string> {
  const now = new Date();

  const [existing] = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.buyerId,    buyerId),
        eq(conversationsTable.storeId,    storeId),
        eq(conversationsTable.productId,  productId),
      ),
    );

  const convId = existing ? existing.id : generateId("conv");

  if (!existing) {
    await db.insert(conversationsTable).values({
      id:               convId,
      storeId,
      buyerId,
      productId,
      productNameAr,
      productNameEn,
      lastMessageText:  systemContent,
      lastMessageAt:    now,
      buyerUnreadCount: 0,
      sellerUnreadCount: 1,
      status:           "active",
      createdAt:        now,
      updatedAt:        now,
    });
  } else {
    const [conv] = await db
      .select({ sellerUnreadCount: conversationsTable.sellerUnreadCount })
      .from(conversationsTable)
      .where(eq(conversationsTable.id, convId));

    await db
      .update(conversationsTable)
      .set({
        lastMessageText:  systemContent,
        lastMessageAt:    now,
        sellerUnreadCount: (conv?.sellerUnreadCount ?? 0) + 1,
        updatedAt:        now,
      })
      .where(eq(conversationsTable.id, convId));
  }

  await db.insert(chatMessagesTable).values({
    id:             generateId("msg"),
    conversationId: convId,
    senderType:     "system",
    senderId:       "system",
    type:           "system",
    content:        systemContent,
    status:         "read",
    createdAt:      now,
  });

  return convId;
}

// ─── Internal: post system message to an existing conversation ────────────────

async function postSystemMessage(conversationId: string, content: string): Promise<void> {
  const now = new Date();

  await db.insert(chatMessagesTable).values({
    id:             generateId("msg"),
    conversationId,
    senderType:     "system",
    senderId:       "system",
    type:           "system",
    content,
    status:         "read",
    createdAt:      now,
  });

  await db
    .update(conversationsTable)
    .set({
      lastMessageText:  content,
      lastMessageAt:    now,
      updatedAt:        now,
      buyerUnreadCount: sql`${conversationsTable.buyerUnreadCount} + 1`,
    })
    .where(eq(conversationsTable.id, conversationId));
}

// ---------------------------------------------------------------------------
// Public service API
// ---------------------------------------------------------------------------

// ─── Create reservation ───────────────────────────────────────────────────────

export interface CreateReservationInput {
  productId:   string;
  buyerId:     string;
  buyerNotes?: string;
}

export async function createReservation(input: CreateReservationInput) {
  const { productId, buyerId, buyerNotes } = input;

  // Validate product + store existence, check for existing buyer reservation,
  // and INSERT — all within a single transaction so a concurrent expiration
  // or second request cannot observe an inconsistent state between the read
  // and the write.

  let reservation: ReservationRow;
  let product: ProductRow;
  let store:   StoreRow;

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Verify the product exists.
      const [prod] = await tx
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, productId));

      if (!prod) {
        throw new ReservationNotFoundError(`Product '${productId}' not found`);
      }

      // 2. Verify the store exists.
      const [str] = await tx
        .select()
        .from(storesTable)
        .where(eq(storesTable.id, prod.storeId));

      if (!str) {
        throw new ReservationNotFoundError(`Store for product '${productId}' not found`);
      }

      // 3. Application-level same-buyer guard: surfaces a precise error message.
      //    The partial unique index is the authoritative DB-level guard for the
      //    general case (different buyers).
      const [existingBuyer] = await tx
        .select({ id: reservationsTable.id })
        .from(reservationsTable)
        .where(
          and(
            eq(reservationsTable.productId, productId),
            eq(reservationsTable.buyerId,   buyerId),
            inArray(reservationsTable.status, ["pending", "confirmed"]),
          ),
        );

      if (existingBuyer) {
        throw new ReservationConflictError(
          "You already have an active reservation for this product",
          "DUPLICATE_RESERVATION",
        );
      }

      // 4. INSERT reservation.
      const reservationId = generateId("res");
      const now = new Date();

      const [created] = await tx
        .insert(reservationsTable)
        .values({
          id:         reservationId,
          productId,
          storeId:    prod.storeId,
          buyerId,
          status:     "pending",
          buyerNotes: buyerNotes ?? null,
          expiresAt:  defaultExpiresAt(),
          createdAt:  now,
          updatedAt:  now,
        })
        .returning();

      // 5. Write creation audit entry.
      await writeAuditLog({
        tx,
        reservationId,
        fromStatus: null,
        toStatus:   "pending",
        actor:      buyerId,
        actorType:  "buyer",
        metadata:   { productId, storeId: prod.storeId, buyerNotes: buyerNotes ?? null },
      });

      return { reservation: created, product: prod, store: str };
    });

    reservation = result.reservation;
    product     = result.product;
    store       = result.store;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ReservationConflictError(
        "This product already has an active reservation",
        "PRODUCT_ALREADY_RESERVED",
      );
    }
    throw err;
  }

  // 6. Create or reuse conversation — non-fatal side effect outside the
  //    main transaction to keep the transaction short.
  const systemCreatedContent =
    `🔔 طلب حجز على: ${product.nameAr} — Reservation request for: ${product.nameEn}`;

  let conversationId: string | null = null;
  try {
    conversationId = await ensureConversationWithMessage(
      buyerId,
      product.storeId,
      productId,
      product.nameAr,
      product.nameEn,
      systemCreatedContent,
    );

    await db
      .update(reservationsTable)
      .set({ conversationId, updatedAt: new Date() })
      .where(eq(reservationsTable.id, reservation.id));

    reservation = { ...reservation, conversationId };
  } catch (convErr) {
    logger.error(
      { err: convErr, reservationId: reservation.id },
      "Failed to create conversation for reservation",
    );
  }

  // 7. Notify the merchant.
  await createNotification({
    userId:  product.storeId,
    type:    "reservation_created",
    titleAr: "طلب حجز جديد",
    titleEn: "New Reservation Request",
    bodyAr:  `${buyerId.slice(0, 8)}… طلب حجز جهاز ${product.nameAr}`,
    bodyEn:  `A buyer requested a reservation for ${product.nameEn}`,
    metadata: {
      reservationId:  reservation.id,
      productId,
      productNameAr:  product.nameAr,
      productNameEn:  product.nameEn,
      buyerId,
      conversationId: conversationId ?? null,
    },
  });

  logger.info(
    { reservationId: reservation.id, productId, buyerId, storeId: product.storeId },
    "Reservation created",
  );

  return toReservationDto(reservation, product, store);
}

// ─── Get reservation by ID ────────────────────────────────────────────────────

export interface GetReservationOptions {
  buyerId?: string;
  storeId?: string;
}

export async function getReservation(id: string, options: GetReservationOptions = {}) {
  const ctx = await fetchWithContext(id);

  if (!ctx) {
    throw new ReservationNotFoundError(`Reservation '${id}' not found`);
  }

  const { reservation, product, store } = ctx;

  // Access check: return 404 (not 403) to prevent ID enumeration.
  const { buyerId, storeId } = options;
  if (buyerId || storeId) {
    const isBuyer    = buyerId && reservation.buyerId  === buyerId;
    const isMerchant = storeId && reservation.storeId  === storeId;
    if (!isBuyer && !isMerchant) {
      throw new ReservationNotFoundError(`Reservation '${id}' not found`);
    }
  }

  return toReservationDto(reservation, product, store);
}

// ─── List reservations ────────────────────────────────────────────────────────

export interface ListReservationsOptions {
  buyerId?: string;
  storeId?: string;
  status?:  string;
  limit?:   number;
  offset?:  number;
}

export async function listReservations(options: ListReservationsOptions) {
  const { buyerId, storeId, status, limit = 20, offset = 0 } = options;

  const conditions = [];
  if (buyerId) conditions.push(eq(reservationsTable.buyerId, buyerId));
  if (storeId) conditions.push(eq(reservationsTable.storeId, storeId));
  if (status)  conditions.push(eq(reservationsTable.status,  status));

  const rows = await db
    .select()
    .from(reservationsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(reservationsTable.createdAt))
    .limit(Math.min(limit, 50))
    .offset(offset);

  if (rows.length === 0) return [];

  // Batch-fetch related entities to eliminate N+1 queries.
  const productIds = [...new Set(rows.map((r) => r.productId))];
  const storeIds   = [...new Set(rows.map((r) => r.storeId))];

  const [products, stores] = await Promise.all([
    db.select().from(productsTable).where(inArray(productsTable.id, productIds)),
    db.select().from(storesTable).where(inArray(storesTable.id, storeIds)),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const storeMap   = new Map(stores.map((s)   => [s.id, s]));

  return rows
    .filter((r) => productMap.has(r.productId) && storeMap.has(r.storeId))
    .map((r) =>
      toReservationDto(r, productMap.get(r.productId)!, storeMap.get(r.storeId)!),
    );
}

// ─── Confirm reservation ──────────────────────────────────────────────────────
//
// Idempotent: if the reservation is already confirmed, returns the current DTO.
// Optimistic locking: UPDATE includes WHERE status='pending' so concurrent
// confirms are safe without advisory locks.

export async function confirmReservation(id: string, storeId: string) {
  const now = new Date();

  const updated = await db.transaction(async (tx) => {
    // Read current state inside the transaction.
    const [reservation] = await tx
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, id));

    if (!reservation) {
      throw new ReservationNotFoundError(`Reservation '${id}' not found`);
    }

    if (reservation.storeId !== storeId) {
      throw new ReservationForbiddenError("Only the store owner can confirm this reservation");
    }

    // Idempotency: already in target state.
    if (reservation.status === "confirmed") {
      return reservation;
    }

    assertTransition(reservation.status, "confirmed");

    // Optimistic locking: update only if status is still 'pending'.
    const [result] = await tx
      .update(reservationsTable)
      .set({ status: "confirmed", confirmedAt: now, updatedAt: now })
      .where(
        and(
          eq(reservationsTable.id,     id),
          eq(reservationsTable.status, "pending"),
        ),
      )
      .returning();

    if (!result) {
      // Concurrent update changed status between our SELECT and UPDATE.
      const [current] = await tx
        .select()
        .from(reservationsTable)
        .where(eq(reservationsTable.id, id));

      if (current?.status === "confirmed") return current; // idempotent
      throw new ReservationTransitionError(current?.status ?? "unknown", "confirmed");
    }

    await writeAuditLog({
      tx,
      reservationId: id,
      fromStatus:    reservation.status,
      toStatus:      "confirmed",
      actor:         storeId,
      actorType:     "merchant",
    });

    return result;
  });

  const ctx = await fetchWithContext(id);
  if (!ctx) throw new ReservationNotFoundError("Associated data not found");

  const { product, store } = ctx;

  if (updated.conversationId) {
    await postSystemMessage(
      updated.conversationId,
      `✅ تم تأكيد الحجز — Reservation confirmed for ${product.nameEn}`,
    );
  }

  await createNotification({
    userId:  updated.buyerId,
    type:    "reservation_confirmed",
    titleAr: "تم تأكيد حجزك",
    titleEn: "Reservation Confirmed",
    bodyAr:  `تم تأكيد حجزك لجهاز ${product.nameAr} في متجر ${store.nameAr}`,
    bodyEn:  `Your reservation for ${product.nameEn} at ${store.nameEn} has been confirmed`,
    metadata: {
      reservationId: id,
      productId:     updated.productId,
      storeId:       updated.storeId,
      storeNameAr:   store.nameAr,
      storeNameEn:   store.nameEn,
      storeAddress:  store.address,
    },
  });

  logger.info({ reservationId: id, storeId }, "Reservation confirmed");

  return toReservationDto(updated, product, store);
}

// ─── Decline reservation ──────────────────────────────────────────────────────

export interface DeclineReservationInput {
  storeId:             string;
  cancellationReason?: string;
}

export async function declineReservation(id: string, input: DeclineReservationInput) {
  const { storeId, cancellationReason } = input;
  const now = new Date();

  const updated = await db.transaction(async (tx) => {
    const [reservation] = await tx
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, id));

    if (!reservation) {
      throw new ReservationNotFoundError(`Reservation '${id}' not found`);
    }

    if (reservation.storeId !== storeId) {
      throw new ReservationForbiddenError("Only the store owner can decline this reservation");
    }

    // Idempotency: already declined.
    if (reservation.status === "declined") return reservation;

    assertTransition(reservation.status, "declined");

    const [result] = await tx
      .update(reservationsTable)
      .set({
        status:     "declined",
        declinedAt: now,
        updatedAt:  now,
        ...(cancellationReason ? { merchantNotes: cancellationReason } : {}),
      })
      .where(
        and(
          eq(reservationsTable.id,     id),
          eq(reservationsTable.status, "pending"),
        ),
      )
      .returning();

    if (!result) {
      const [current] = await tx.select().from(reservationsTable).where(eq(reservationsTable.id, id));
      if (current?.status === "declined") return current;
      throw new ReservationTransitionError(current?.status ?? "unknown", "declined");
    }

    await writeAuditLog({
      tx,
      reservationId: id,
      fromStatus:    reservation.status,
      toStatus:      "declined",
      actor:         storeId,
      actorType:     "merchant",
      reason:        cancellationReason,
    });

    return result;
  });

  const ctx = await fetchWithContext(id);
  if (!ctx) throw new ReservationNotFoundError("Associated data not found");

  const { product, store } = ctx;

  if (updated.conversationId) {
    await postSystemMessage(updated.conversationId, `❌ تم رفض الحجز — Reservation declined`);
  }

  await createNotification({
    userId:  updated.buyerId,
    type:    "reservation_declined",
    titleAr: "تم رفض طلب الحجز",
    titleEn: "Reservation Declined",
    bodyAr:  `تم رفض حجزك لجهاز ${product.nameAr}${cancellationReason ? ` — ${cancellationReason}` : ""}`,
    bodyEn:  `Your reservation for ${product.nameEn} was declined${cancellationReason ? ` — ${cancellationReason}` : ""}`,
    metadata: {
      reservationId:      id,
      productId:          updated.productId,
      storeNameAr:        store.nameAr,
      cancellationReason: cancellationReason ?? null,
    },
  });

  logger.info({ reservationId: id, storeId }, "Reservation declined");

  return toReservationDto(updated, product, store);
}

// ─── Cancel reservation ───────────────────────────────────────────────────────

export interface CancelReservationInput {
  buyerId?:            string;
  storeId?:            string;
  cancellationReason?: string;
}

export async function cancelReservation(id: string, input: CancelReservationInput) {
  const { buyerId, storeId, cancellationReason } = input;

  if (!buyerId && !storeId) {
    throw new ReservationForbiddenError("Either buyerId or storeId is required to cancel");
  }

  const now = new Date();

  const updated = await db.transaction(async (tx) => {
    const [reservation] = await tx
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, id));

    if (!reservation) {
      throw new ReservationNotFoundError(`Reservation '${id}' not found`);
    }

    const isBuyer    = buyerId && reservation.buyerId  === buyerId;
    const isMerchant = storeId && reservation.storeId  === storeId;

    if (!isBuyer && !isMerchant) {
      throw new ReservationNotFoundError(`Reservation '${id}' not found`);
    }

    // Idempotency: already cancelled.
    if (reservation.status === "cancelled") return { result: reservation, cancelledBy: reservation.cancelledBy as string };

    assertTransition(reservation.status, "cancelled");

    const cancelledBy = isBuyer ? "buyer" : "merchant";

    const [result] = await tx
      .update(reservationsTable)
      .set({
        status:      "cancelled",
        cancelledBy,
        cancelledAt: now,
        updatedAt:   now,
        ...(cancellationReason
          ? cancelledBy === "buyer"
            ? { buyerNotes:    cancellationReason }
            : { merchantNotes: cancellationReason }
          : {}),
      })
      .where(
        and(
          eq(reservationsTable.id, id),
          inArray(reservationsTable.status, ["pending", "confirmed"]),
        ),
      )
      .returning();

    if (!result) {
      const [current] = await tx.select().from(reservationsTable).where(eq(reservationsTable.id, id));
      if (current?.status === "cancelled") return { result: current, cancelledBy: current.cancelledBy as string };
      throw new ReservationTransitionError(current?.status ?? "unknown", "cancelled");
    }

    await writeAuditLog({
      tx,
      reservationId: id,
      fromStatus:    reservation.status,
      toStatus:      "cancelled",
      actor:         (isBuyer ? buyerId : storeId) as string,
      actorType:     cancelledBy === "buyer" ? "buyer" : "merchant",
      reason:        cancellationReason,
    });

    return { result, cancelledBy };
  });

  const ctx = await fetchWithContext(id);
  if (!ctx) throw new ReservationNotFoundError("Associated data not found");

  const { product, store } = ctx;
  const cancelledByBuyer = updated.cancelledBy === "buyer";

  const systemMsg = cancelledByBuyer
    ? `↩️ ألغى العميل الحجز — Customer cancelled the reservation`
    : `↩️ ألغى المتجر الحجز — Store cancelled the reservation`;

  if (updated.result.conversationId) {
    await postSystemMessage(updated.result.conversationId, systemMsg);
  }

  const recipientId = cancelledByBuyer ? updated.result.storeId : updated.result.buyerId;
  await createNotification({
    userId:  recipientId,
    type:    "reservation_cancelled",
    titleAr: "تم إلغاء الحجز",
    titleEn: "Reservation Cancelled",
    bodyAr: cancelledByBuyer
      ? `ألغى العميل حجز جهاز ${product.nameAr}`
      : `تم إلغاء حجزك لجهاز ${product.nameAr}`,
    bodyEn: cancelledByBuyer
      ? `A buyer cancelled their reservation for ${product.nameEn}`
      : `Your reservation for ${product.nameEn} was cancelled by the store`,
    metadata: {
      reservationId:      id,
      productId:          updated.result.productId,
      cancelledBy:        updated.cancelledBy,
      cancellationReason: cancellationReason ?? null,
    },
  });

  logger.info({ reservationId: id, cancelledBy: updated.cancelledBy }, "Reservation cancelled");

  return toReservationDto(updated.result, product, store);
}

// ─── Complete reservation ─────────────────────────────────────────────────────

export async function completeReservation(id: string, storeId: string) {
  const now = new Date();

  const updated = await db.transaction(async (tx) => {
    const [reservation] = await tx
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, id));

    if (!reservation) {
      throw new ReservationNotFoundError(`Reservation '${id}' not found`);
    }

    if (reservation.storeId !== storeId) {
      throw new ReservationForbiddenError("Only the store owner can complete this reservation");
    }

    // Idempotency: already completed.
    if (reservation.status === "completed") return reservation;

    assertTransition(reservation.status, "completed");

    const [result] = await tx
      .update(reservationsTable)
      .set({ status: "completed", completedAt: now, updatedAt: now })
      .where(
        and(
          eq(reservationsTable.id,     id),
          eq(reservationsTable.status, "confirmed"),
        ),
      )
      .returning();

    if (!result) {
      const [current] = await tx.select().from(reservationsTable).where(eq(reservationsTable.id, id));
      if (current?.status === "completed") return current;
      throw new ReservationTransitionError(current?.status ?? "unknown", "completed");
    }

    await writeAuditLog({
      tx,
      reservationId: id,
      fromStatus:    reservation.status,
      toStatus:      "completed",
      actor:         storeId,
      actorType:     "merchant",
    });

    return result;
  });

  const ctx = await fetchWithContext(id);
  if (!ctx) throw new ReservationNotFoundError("Associated data not found");

  const { product, store } = ctx;

  if (updated.conversationId) {
    await postSystemMessage(
      updated.conversationId,
      `🎉 تم اكتمال الحجز — Reservation completed. Thank you for your visit!`,
    );
  }

  await createNotification({
    userId:  updated.buyerId,
    type:    "reservation_completed",
    titleAr: "اكتمل الحجز",
    titleEn: "Reservation Completed",
    bodyAr:  `شكراً لزيارتك! تم اكتمال حجز جهاز ${product.nameAr}`,
    bodyEn:  `Thank you for your visit! Your reservation for ${product.nameEn} is now complete.`,
    metadata: {
      reservationId: id,
      productId:     updated.productId,
      storeId:       updated.storeId,
      storeNameAr:   store.nameAr,
      storeNameEn:   store.nameEn,
    },
  });

  logger.info({ reservationId: id, storeId }, "Reservation completed");

  return toReservationDto(updated, product, store);
}

// ─── Expire reservation (called by background worker) ─────────────────────────
//
// Transitions a single pending reservation to 'expired'.
// Safe to call concurrently: the optimistic WHERE clause ensures only one
// caller succeeds when multiple workers race on the same ID.
// Returns the DTO on success, null if the reservation was already handled.

export async function expireReservation(id: string): Promise<ReturnType<typeof toReservationDto> | null> {
  const now = new Date();

  const updated = await db.transaction(async (tx) => {
    const [reservation] = await tx
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.id, id));

    if (!reservation) return null;

    // Guard: only pending reservations past their deadline should be expired.
    if (reservation.status !== "pending" || reservation.expiresAt > now) {
      return null; // Already handled or not yet due.
    }

    const [result] = await tx
      .update(reservationsTable)
      .set({ status: "expired", expiredAt: now, updatedAt: now })
      .where(
        and(
          eq(reservationsTable.id,     id),
          eq(reservationsTable.status, "pending"),
          lt(reservationsTable.expiresAt, now),
        ),
      )
      .returning();

    if (!result) return null; // Concurrent worker beat us — idempotent.

    await writeAuditLog({
      tx,
      reservationId: id,
      fromStatus:    "pending",
      toStatus:      "expired",
      actor:         "system",
      actorType:     "system",
      reason:        "Reservation expired after 48-hour deadline",
      metadata:      { expiresAt: reservation.expiresAt.toISOString() },
    });

    return result;
  });

  if (!updated) return null;

  // Side effects outside the transaction — failures are logged but not fatal.
  try {
    if (updated.conversationId) {
      await postSystemMessage(
        updated.conversationId,
        `⏰ انتهت صلاحية الحجز — Reservation expired (merchant did not respond in time)`,
      );
    }

    await createNotification({
      userId:  updated.buyerId,
      type:    "reservation_expired",
      titleAr: "انتهت صلاحية الحجز",
      titleEn: "Reservation Expired",
      bodyAr:  `انتهت صلاحية حجزك — لم يتم الرد من المتجر في الوقت المحدد`,
      bodyEn:  `Your reservation has expired — the store did not respond in time`,
      metadata: {
        reservationId: id,
        productId:     updated.productId,
        storeId:       updated.storeId,
      },
    });
  } catch (err) {
    logger.error({ err, reservationId: id }, "Failed to send expiration side-effects");
  }

  const ctx = await fetchWithContext(id);
  if (!ctx) return null;

  return toReservationDto(updated, ctx.product, ctx.store);
}

// ─── Find expiration candidates (used by background worker) ──────────────────
//
// Returns IDs of pending reservations that have passed their expiresAt.
// Uses the reservations_expires_status_idx index: (expiresAt, status).

export async function findExpirationCandidates(limit = 50): Promise<string[]> {
  const now = new Date();
  const rows = await db
    .select({ id: reservationsTable.id })
    .from(reservationsTable)
    .where(
      and(
        eq(reservationsTable.status, "pending"),
        lt(reservationsTable.expiresAt, now),
      ),
    )
    .orderBy(asc(reservationsTable.expiresAt)) // oldest-first
    .limit(limit);

  return rows.map((r) => r.id);
}

// ─── Reservation history (audit timeline) ────────────────────────────────────

export interface ReservationHistoryEntry {
  id:         string;
  fromStatus: string | null;
  toStatus:   string;
  actor:      string;
  actorType:  string;
  reason:     string | null;
  metadata:   Record<string, unknown> | null;
  createdAt:  string;
}

export async function getReservationHistory(
  id: string,
  options: GetReservationOptions = {},
): Promise<ReservationHistoryEntry[]> {
  // Access-check: re-use getReservation (throws 404 if not found / not authorised).
  await getReservation(id, options);

  const rows = await db
    .select()
    .from(reservationAuditLogTable)
    .where(eq(reservationAuditLogTable.reservationId, id))
    .orderBy(asc(reservationAuditLogTable.createdAt));

  return rows.map((row) => ({
    id:         row.id,
    fromStatus: row.fromStatus ?? null,
    toStatus:   row.toStatus,
    actor:      row.actor,
    actorType:  row.actorType,
    reason:     row.reason ?? null,
    metadata:   row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : null,
    createdAt:  row.createdAt.toISOString(),
  }));
}
