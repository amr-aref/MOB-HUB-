import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { reservationsTable } from "./reservations";

// ─── reservation_audit_log ────────────────────────────────────────────────────
//
// Immutable record of every status transition on a reservation.
// Written inside the same database transaction as the status update —
// if the transaction rolls back, the audit entry rolls back with it.
//
// Actor types:
//   'buyer'    — device UUID from the mobile client
//   'merchant' — storeId of the store that owns the reservation
//   'system'   — the background expiration worker or any automated process

export const reservationAuditLogTable = pgTable(
  "reservation_audit_log",
  {
    id: text("id").primaryKey(),

    reservationId: text("reservation_id")
      .notNull()
      .references(() => reservationsTable.id, { onDelete: "cascade" }),

    /** null only for the CREATED event (no previous state). */
    fromStatus: text("from_status"),

    toStatus: text("to_status").notNull(),

    /** Identity of the actor: buyerId, storeId, or the string 'system'. */
    actor: text("actor").notNull(),

    /** Classification of the actor for display and filtering. */
    actorType: text("actor_type").notNull(), // 'buyer' | 'merchant' | 'system'

    /** Human-readable reason: cancellation note, decline reason, etc. */
    reason: text("reason"),

    /** JSON-encoded arbitrary metadata relevant to the transition. */
    metadata: text("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // Primary read pattern: full timeline for one reservation.
    index("audit_log_reservation_created_idx").on(
      table.reservationId,
      table.createdAt,
    ),
    // Debugging: all actions by a given actor.
    index("audit_log_actor_idx").on(table.actor),
  ],
);

export const reservationAuditLogRelations = relations(
  reservationAuditLogTable,
  ({ one }) => ({
    reservation: one(reservationsTable, {
      fields: [reservationAuditLogTable.reservationId],
      references: [reservationsTable.id],
    }),
  }),
);

export type ReservationAuditLog = typeof reservationAuditLogTable.$inferSelect;
