import { db } from "@workspace/db";
import {
  reservationsTable,
  productsTable,
  storesTable,
  conversationsTable,
  chatMessagesTable,
  type ReservationStatus,
} from "@workspace/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { createNotification } from "./notificationService";
import { logger } from "../lib/logger";

// ---------------------------------------------------------------------------
// Reservation Service
// ---------------------------------------------------------------------------
// All Reservation business logic lives here. Route handlers call these
// functions and translate the results to HTTP responses — they contain no
// business rules themselves.
//
// Identity model (matches existing project conventions):
//   buyerId  = device UUID from the mobile client (anonymous, auth-ready)
//   storeId  = the store's primary key (used as merchant identity)
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

const ALLOWED_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  pending: ["confirmed", "declined", "cancelled"],
  confirmed: ["completed", "cancelled"],
  declined: [],
  cancelled: [],
  expired: [],
  completed: [],
};

function assertTransition(from: string, to: ReservationStatus): void {
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
  return new Date(Date.now() + 48 * 60 * 60 * 1000);
}

/** Returns true when a DB error is a unique-constraint violation (PG code 23505).
 *
 * Drizzle wraps the underlying PG error in a `_DrizzleQueryError` whose
 * `cause` holds the original `pg` error object containing `code: "23505"`.
 * We check both the top-level code and the nested cause to be safe.
 */
function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as Record<string, unknown>;

  // Direct PG error (e.g. from a plain pool query).
  if (e.code === "23505") return true;

  // Drizzle's _DrizzleQueryError wraps the PG error in `.cause`.
  if (
    typeof e.cause === "object" &&
    e.cause !== null &&
    (e.cause as Record<string, unknown>).code === "23505"
  ) {
    return true;
  }

  // Final fallback: match the constraint violation message string.
  if (typeof e.message === "string" && e.message.includes("unique constraint")) {
    return true;
  }

  return false;
}

// ─── DTO types ────────────────────────────────────────────────────────────────

type ReservationRow = typeof reservationsTable.$inferSelect;
type ProductRow = typeof productsTable.$inferSelect;
type StoreRow = typeof storesTable.$inferSelect;

export function toReservationDto(
  reservation: ReservationRow,
  product: ProductRow,
  store: StoreRow,
) {
  return {
    id: reservation.id,
    productId: reservation.productId,
    product: {
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      price: product.price,
      imageColor: product.imageColor,
      brand: product.brand,
      model: product.model,
    },
    storeId: reservation.storeId,
    store: {
      nameAr: store.nameAr,
      nameEn: store.nameEn,
      logoColor: store.logoColor,
      logoInitial: store.logoInitial,
      address: store.address,
      phone: store.phone,
    },
    buyerId: reservation.buyerId,
    conversationId: reservation.conversationId ?? null,
    status: reservation.status,
    cancelledBy: reservation.cancelledBy ?? null,
    buyerNotes: reservation.buyerNotes ?? null,
    merchantNotes: reservation.merchantNotes ?? null,
    expiresAt: reservation.expiresAt.toISOString(),
    confirmedAt: reservation.confirmedAt ? reservation.confirmedAt.toISOString() : null,
    declinedAt: reservation.declinedAt ? reservation.declinedAt.toISOString() : null,
    cancelledAt: reservation.cancelledAt ? reservation.cancelledAt.toISOString() : null,
    completedAt: reservation.completedAt ? reservation.completedAt.toISOString() : null,
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
  };
}

// ─── Internal: fetch reservation with its product + store context ─────────────

async function fetchWithContext(id: string) {
  const [reservation] = await db
    .select()
    .from(reservationsTable)
    .where(eq(reservationsTable.id, id));

  if (!reservation) return null;

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, reservation.productId));

  const [store] = await db
    .select()
    .from(storesTable)
    .where(eq(storesTable.id, reservation.storeId));

  if (!product || !store) return null;

  return { reservation, product, store };
}

// ─── Internal: create or reuse conversation + post system message ─────────────
//
// Mirrors the idempotency logic in the conversations route: one conversation
// per (buyerId + storeId + productId) triple. Used when a reservation is
// created to ensure chat is always available alongside the reservation.

async function ensureConversationWithMessage(
  buyerId: string,
  storeId: string,
  productId: string,
  productNameAr: string,
  productNameEn: string,
  systemContent: string,
): Promise<string> {
  const now = new Date();

  const [existing] = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.buyerId, buyerId),
        eq(conversationsTable.storeId, storeId),
        eq(conversationsTable.productId, productId),
      ),
    );

  const convId = existing ? existing.id : generateId("conv");

  if (!existing) {
    await db.insert(conversationsTable).values({
      id: convId,
      storeId,
      buyerId,
      productId,
      productNameAr,
      productNameEn,
      lastMessageText: systemContent,
      lastMessageAt: now,
      buyerUnreadCount: 0,
      sellerUnreadCount: 1,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  } else {
    // Increment seller unread count and update last-message snapshot.
    const [conv] = await db
      .select({ sellerUnreadCount: conversationsTable.sellerUnreadCount })
      .from(conversationsTable)
      .where(eq(conversationsTable.id, convId));

    await db
      .update(conversationsTable)
      .set({
        lastMessageText: systemContent,
        lastMessageAt: now,
        sellerUnreadCount: (conv?.sellerUnreadCount ?? 0) + 1,
        updatedAt: now,
      })
      .where(eq(conversationsTable.id, convId));
  }

  await db.insert(chatMessagesTable).values({
    id: generateId("msg"),
    conversationId: convId,
    senderType: "system",
    senderId: "system",
    type: "system",
    content: systemContent,
    status: "read",
    createdAt: now,
  });

  return convId;
}

// ─── Internal: post system message to an existing conversation ────────────────

async function postSystemMessage(conversationId: string, content: string): Promise<void> {
  const now = new Date();

  await db.insert(chatMessagesTable).values({
    id: generateId("msg"),
    conversationId,
    senderType: "system",
    senderId: "system",
    type: "system",
    content,
    status: "read",
    createdAt: now,
  });

  await db
    .update(conversationsTable)
    .set({
      lastMessageText: content,
      lastMessageAt: now,
      updatedAt: now,
      buyerUnreadCount: sql`${conversationsTable.buyerUnreadCount} + 1`,
    })
    .where(eq(conversationsTable.id, conversationId));
}

// ---------------------------------------------------------------------------
// Public service API
// ---------------------------------------------------------------------------

// ─── Create reservation ───────────────────────────────────────────────────────

export interface CreateReservationInput {
  productId: string;
  buyerId: string;
  buyerNotes?: string;
}

export async function createReservation(input: CreateReservationInput) {
  const { productId, buyerId, buyerNotes } = input;

  // 1. Verify the product exists.
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId));

  if (!product) {
    throw new ReservationNotFoundError(`Product '${productId}' not found`);
  }

  // 2. Verify the store exists.
  const [store] = await db
    .select()
    .from(storesTable)
    .where(eq(storesTable.id, product.storeId));

  if (!store) {
    throw new ReservationNotFoundError(`Store for product '${productId}' not found`);
  }

  // 3. Application-level duplicate check: same buyer + same product already active.
  //    The unique partial index is the authoritative DB-level guard; this check
  //    surfaces a more specific error message for the same-buyer case.
  const [existingBuyer] = await db
    .select({ id: reservationsTable.id })
    .from(reservationsTable)
    .where(
      and(
        eq(reservationsTable.productId, productId),
        eq(reservationsTable.buyerId, buyerId),
        inArray(reservationsTable.status, ["pending", "confirmed"]),
      ),
    );

  if (existingBuyer) {
    throw new ReservationConflictError(
      "You already have an active reservation for this product",
      "DUPLICATE_RESERVATION",
    );
  }

  // 4. INSERT reservation. The unique partial index raises a 23505 error if
  //    another buyer's active reservation already exists for this product.
  const reservationId = generateId("res");
  const now = new Date();

  let reservation: ReservationRow;
  try {
    const [created] = await db
      .insert(reservationsTable)
      .values({
        id: reservationId,
        productId,
        storeId: product.storeId,
        buyerId,
        status: "pending",
        buyerNotes: buyerNotes ?? null,
        expiresAt: defaultExpiresAt(),
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    reservation = created;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ReservationConflictError(
        "This product already has an active reservation",
        "PRODUCT_ALREADY_RESERVED",
      );
    }
    throw err;
  }

  // 5. Create or reuse the conversation and post a system message.
  //    conversationId is nullable — if this step fails the reservation still
  //    exists and the conversation can be created on first message.
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
      .where(eq(reservationsTable.id, reservationId));

    reservation = { ...reservation, conversationId };
  } catch (convErr) {
    // Non-fatal: log and continue. The buyer can still see their reservation;
    // the conversation link will be created when they open the chat.
    logger.error({ err: convErr, reservationId }, "Failed to create conversation for reservation");
  }

  // 6. Notify the merchant.
  await createNotification({
    userId: product.storeId,
    type: "reservation_created",
    titleAr: "طلب حجز جديد",
    titleEn: "New Reservation Request",
    bodyAr: `${buyerId.slice(0, 8)}… طلب حجز جهاز ${product.nameAr}`,
    bodyEn: `A buyer requested a reservation for ${product.nameEn}`,
    metadata: {
      reservationId,
      productId,
      productNameAr: product.nameAr,
      productNameEn: product.nameEn,
      buyerId,
      conversationId: conversationId ?? null,
    },
  });

  logger.info({ reservationId, productId, buyerId, storeId: product.storeId }, "Reservation created");

  return toReservationDto(reservation, product, store);
}

// ─── Get reservation by ID ────────────────────────────────────────────────────

export interface GetReservationOptions {
  /** If provided, the reservation must belong to this buyer. */
  buyerId?: string;
  /** If provided, the reservation must belong to this store. */
  storeId?: string;
}

export async function getReservation(id: string, options: GetReservationOptions = {}) {
  const ctx = await fetchWithContext(id);

  if (!ctx) {
    throw new ReservationNotFoundError(`Reservation '${id}' not found`);
  }

  const { reservation, product, store } = ctx;

  // Access check: caller must be the buyer OR the merchant — return 404 (not 403)
  // to prevent ID enumeration.
  const { buyerId, storeId } = options;
  if (buyerId || storeId) {
    const isBuyer = buyerId && reservation.buyerId === buyerId;
    const isMerchant = storeId && reservation.storeId === storeId;
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
  status?: string;
  limit?: number;
  offset?: number;
}

export async function listReservations(options: ListReservationsOptions) {
  const { buyerId, storeId, status, limit = 20, offset = 0 } = options;

  const conditions = [];
  if (buyerId) conditions.push(eq(reservationsTable.buyerId, buyerId));
  if (storeId) conditions.push(eq(reservationsTable.storeId, storeId));
  if (status) conditions.push(eq(reservationsTable.status, status));

  const rows = await db
    .select()
    .from(reservationsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(reservationsTable.createdAt))
    .limit(Math.min(limit, 50))
    .offset(offset);

  if (rows.length === 0) return [];

  // Batch-fetch products and stores to avoid N+1.
  const productIds = [...new Set(rows.map((r) => r.productId))];
  const storeIds = [...new Set(rows.map((r) => r.storeId))];

  const products = await db
    .select()
    .from(productsTable)
    .where(inArray(productsTable.id, productIds));

  const stores = await db
    .select()
    .from(storesTable)
    .where(inArray(storesTable.id, storeIds));

  const productMap = new Map(products.map((p) => [p.id, p]));
  const storeMap = new Map(stores.map((s) => [s.id, s]));

  return rows
    .filter((r) => productMap.has(r.productId) && storeMap.has(r.storeId))
    .map((r) => toReservationDto(r, productMap.get(r.productId)!, storeMap.get(r.storeId)!));
}

// ─── Confirm reservation ──────────────────────────────────────────────────────

export async function confirmReservation(id: string, storeId: string) {
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
      throw new ReservationForbiddenError("Only the store owner can confirm this reservation");
    }

    assertTransition(reservation.status, "confirmed");

    const [result] = await tx
      .update(reservationsTable)
      .set({ status: "confirmed", confirmedAt: now, updatedAt: now })
      .where(eq(reservationsTable.id, id))
      .returning();

    return result;
  });

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, updated.productId));

  const [store] = await db
    .select()
    .from(storesTable)
    .where(eq(storesTable.id, updated.storeId));

  if (!product || !store) {
    throw new ReservationNotFoundError("Associated product or store not found");
  }

  if (updated.conversationId) {
    await postSystemMessage(
      updated.conversationId,
      `✅ تم تأكيد الحجز — Reservation confirmed for ${product.nameEn}`,
    );
  }

  await createNotification({
    userId: updated.buyerId,
    type: "reservation_confirmed",
    titleAr: "تم تأكيد حجزك",
    titleEn: "Reservation Confirmed",
    bodyAr: `تم تأكيد حجزك لجهاز ${product.nameAr} في متجر ${store.nameAr}`,
    bodyEn: `Your reservation for ${product.nameEn} at ${store.nameEn} has been confirmed`,
    metadata: {
      reservationId: id,
      productId: updated.productId,
      storeId: updated.storeId,
      storeNameAr: store.nameAr,
      storeNameEn: store.nameEn,
      storeAddress: store.address,
    },
  });

  logger.info({ reservationId: id, storeId }, "Reservation confirmed");

  return toReservationDto(updated, product, store);
}

// ─── Decline reservation ──────────────────────────────────────────────────────

export interface DeclineReservationInput {
  storeId: string;
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

    assertTransition(reservation.status, "declined");

    const [result] = await tx
      .update(reservationsTable)
      .set({
        status: "declined",
        declinedAt: now,
        updatedAt: now,
        ...(cancellationReason ? { merchantNotes: cancellationReason } : {}),
      })
      .where(eq(reservationsTable.id, id))
      .returning();

    return result;
  });

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, updated.productId));

  const [store] = await db
    .select()
    .from(storesTable)
    .where(eq(storesTable.id, updated.storeId));

  if (!product || !store) {
    throw new ReservationNotFoundError("Associated product or store not found");
  }

  if (updated.conversationId) {
    await postSystemMessage(
      updated.conversationId,
      `❌ تم رفض الحجز — Reservation declined`,
    );
  }

  await createNotification({
    userId: updated.buyerId,
    type: "reservation_declined",
    titleAr: "تم رفض طلب الحجز",
    titleEn: "Reservation Declined",
    bodyAr: `تم رفض حجزك لجهاز ${product.nameAr}${cancellationReason ? ` — ${cancellationReason}` : ""}`,
    bodyEn: `Your reservation for ${product.nameEn} was declined${cancellationReason ? ` — ${cancellationReason}` : ""}`,
    metadata: {
      reservationId: id,
      productId: updated.productId,
      storeNameAr: store.nameAr,
      cancellationReason: cancellationReason ?? null,
    },
  });

  logger.info({ reservationId: id, storeId }, "Reservation declined");

  return toReservationDto(updated, product, store);
}

// ─── Cancel reservation ───────────────────────────────────────────────────────

export interface CancelReservationInput {
  /** Provide one of buyerId or storeId to identify the actor. */
  buyerId?: string;
  storeId?: string;
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

    // Ownership: caller must be the buyer or the store.
    const isBuyer = buyerId && reservation.buyerId === buyerId;
    const isMerchant = storeId && reservation.storeId === storeId;

    if (!isBuyer && !isMerchant) {
      throw new ReservationNotFoundError(`Reservation '${id}' not found`);
    }

    assertTransition(reservation.status, "cancelled");

    const cancelledBy = isBuyer ? "buyer" : "merchant";

    const [result] = await tx
      .update(reservationsTable)
      .set({
        status: "cancelled",
        cancelledBy,
        cancelledAt: now,
        updatedAt: now,
        ...(cancellationReason
          ? cancelledBy === "buyer"
            ? { buyerNotes: cancellationReason }
            : { merchantNotes: cancellationReason }
          : {}),
      })
      .where(eq(reservationsTable.id, id))
      .returning();

    return { result, cancelledBy };
  });

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, updated.result.productId));

  const [store] = await db
    .select()
    .from(storesTable)
    .where(eq(storesTable.id, updated.result.storeId));

  if (!product || !store) {
    throw new ReservationNotFoundError("Associated product or store not found");
  }

  const cancelledByBuyer = updated.cancelledBy === "buyer";

  const systemMsg = cancelledByBuyer
    ? `↩️ ألغى العميل الحجز — Customer cancelled the reservation`
    : `↩️ ألغى المتجر الحجز — Store cancelled the reservation`;

  if (updated.result.conversationId) {
    await postSystemMessage(updated.result.conversationId, systemMsg);
  }

  // Notify the other party.
  const recipientId = cancelledByBuyer ? updated.result.storeId : updated.result.buyerId;
  await createNotification({
    userId: recipientId,
    type: "reservation_cancelled",
    titleAr: "تم إلغاء الحجز",
    titleEn: "Reservation Cancelled",
    bodyAr: cancelledByBuyer
      ? `ألغى العميل حجز جهاز ${product.nameAr}`
      : `تم إلغاء حجزك لجهاز ${product.nameAr}`,
    bodyEn: cancelledByBuyer
      ? `A buyer cancelled their reservation for ${product.nameEn}`
      : `Your reservation for ${product.nameEn} was cancelled by the store`,
    metadata: {
      reservationId: id,
      productId: updated.result.productId,
      cancelledBy: updated.cancelledBy,
      cancellationReason: cancellationReason ?? null,
    },
  });

  logger.info(
    { reservationId: id, cancelledBy: updated.cancelledBy },
    "Reservation cancelled",
  );

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

    assertTransition(reservation.status, "completed");

    const [result] = await tx
      .update(reservationsTable)
      .set({ status: "completed", completedAt: now, updatedAt: now })
      .where(eq(reservationsTable.id, id))
      .returning();

    return result;
  });

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, updated.productId));

  const [store] = await db
    .select()
    .from(storesTable)
    .where(eq(storesTable.id, updated.storeId));

  if (!product || !store) {
    throw new ReservationNotFoundError("Associated product or store not found");
  }

  if (updated.conversationId) {
    await postSystemMessage(
      updated.conversationId,
      `🎉 تم اكتمال الحجز — Reservation completed. Thank you for your visit!`,
    );
  }

  await createNotification({
    userId: updated.buyerId,
    type: "reservation_completed",
    titleAr: "اكتمل الحجز",
    titleEn: "Reservation Completed",
    bodyAr: `شكراً لزيارتك! تم اكتمال حجز جهاز ${product.nameAr}`,
    bodyEn: `Thank you for your visit! Your reservation for ${product.nameEn} is now complete.`,
    metadata: {
      reservationId: id,
      productId: updated.productId,
      storeId: updated.storeId,
      storeNameAr: store.nameAr,
      storeNameEn: store.nameEn,
    },
  });

  logger.info({ reservationId: id, storeId }, "Reservation completed");

  return toReservationDto(updated, product, store);
}
