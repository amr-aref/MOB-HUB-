import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { storesTable } from "./stores";
import { productsTable } from "./products";
import { conversationsTable } from "./conversations";

// ─── Reservation status ───────────────────────────────────────────────────────
//
// Kept as a plain-text column (same convention as other status fields in the
// project) so new statuses require no schema migration — only an extension of
// this constant and the corresponding application logic.

export const RESERVATION_STATUSES = [
  "pending",    // Created by buyer; awaiting merchant decision.
  "confirmed",  // Merchant accepted; customer is expected to visit the store.
  "declined",   // Merchant rejected the request. Terminal.
  "cancelled",  // Either party cancelled before the visit. Terminal.
  "expired",    // System auto-cancelled after the TTL elapsed. Terminal.
  "completed",  // Merchant marked the in-store visit as done. Terminal.
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

// ─── reservations ─────────────────────────────────────────────────────────────
//
// Core aggregate for the reserve-and-visit business flow:
//   Buyer reserves product → Merchant confirms → Buyer visits physical store.
//
// buyerId is a device-level UUID — the same anonymous identity already used by
// conversations and reviews (auth is a future sprint; field is auth-ready).
//
// storeId is denormalised from the product so merchant-scoped queries
// (dashboard, reservation list) avoid a JOIN on every request.

export const reservationsTable = pgTable(
  "reservations",
  {
    id: text("id").primaryKey(),

    // ── Core relationships ────────────────────────────────────────────────
    productId: text("product_id")
      .notNull()
      .references(() => productsTable.id, { onDelete: "restrict" }),

    /** Denormalised from the product for efficient merchant-dashboard queries. */
    storeId: text("store_id")
      .notNull()
      .references(() => storesTable.id, { onDelete: "restrict" }),

    /** Device-based pseudo user ID (auth-ready; replace with user FK in a future sprint). */
    buyerId: text("buyer_id").notNull(),

    /**
     * Linked conversation; populated when a conversation is created or reused
     * on reservation creation. Nullable: the conversation may not yet exist
     * when the reservation is first inserted.
     */
    conversationId: text("conversation_id").references(
      () => conversationsTable.id,
      { onDelete: "set null" },
    ),

    // ── Status ───────────────────────────────────────────────────────────
    /** Current lifecycle state. One of RESERVATION_STATUSES. */
    status: text("status").notNull().default("pending"),

    /**
     * Set when status = 'cancelled'; identifies who initiated the cancellation.
     * Values: 'buyer' | 'merchant' | 'system'
     */
    cancelledBy: text("cancelled_by"),

    // ── Actor notes ───────────────────────────────────────────────────────
    /** Optional free-text notes provided by the buyer at reservation time. */
    buyerNotes: text("buyer_notes"),

    /** Optional free-text notes from the merchant (e.g., pickup instructions). */
    merchantNotes: text("merchant_notes"),

    // ── Lifecycle timestamps ──────────────────────────────────────────────
    /**
     * Deadline for the merchant to respond. Automatically set to
     * createdAt + 48 h by the application layer. The expiry job transitions
     * the reservation to 'expired' when this timestamp elapses.
     */
    expiresAt: timestamp("expires_at").notNull(),

    /** Set when the merchant confirms the reservation. */
    confirmedAt: timestamp("confirmed_at"),

    /** Set when the merchant declines the reservation. */
    declinedAt: timestamp("declined_at"),

    /** Set when either party cancels the reservation. */
    cancelledAt: timestamp("cancelled_at"),

    /** Set when the merchant marks the in-store visit as completed. */
    completedAt: timestamp("completed_at"),

    // ── Audit ─────────────────────────────────────────────────────────────
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // Merchant dashboard: "show all reservations for my store, filtered by status"
    index("reservations_store_status_idx").on(table.storeId, table.status),

    // Buyer view: "show my reservations, filtered by status"
    index("reservations_buyer_status_idx").on(table.buyerId, table.status),

    // Product availability lookup: "does this product have an active reservation?"
    index("reservations_product_idx").on(table.productId),

    // Expiry cron: "find all pending reservations past their deadline"
    index("reservations_expires_status_idx").on(table.expiresAt, table.status),

    // Default sort for all reservation list queries
    index("reservations_created_idx").on(table.createdAt),

    // ── CONCURRENCY GUARD ─────────────────────────────────────────────────
    // Enforces the business rule: at most one active (pending or confirmed)
    // reservation may exist per product at any given time.
    // A second INSERT for the same productId while a pending/confirmed row
    // already exists raises a unique-constraint violation (HTTP 409 at the
    // API layer). This is the authoritative lock — application-level checks
    // are the user-experience layer on top of it.
    uniqueIndex("reservations_product_active_uniq")
      .on(table.productId)
      .where(sql`${table.status} IN ('pending', 'confirmed')`),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const reservationsRelations = relations(reservationsTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [reservationsTable.productId],
    references: [productsTable.id],
  }),
  store: one(storesTable, {
    fields: [reservationsTable.storeId],
    references: [storesTable.id],
  }),
  conversation: one(conversationsTable, {
    fields: [reservationsTable.conversationId],
    references: [conversationsTable.id],
  }),
}));

// ─── Zod schemas & TypeScript types ──────────────────────────────────────────

export const insertReservationSchema = createInsertSchema(reservationsTable);
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservationsTable.$inferSelect;
