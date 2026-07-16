import { index, jsonb, pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── notifications ─────────────────────────────────────────────────────────
// Centralized notification store shared by every module (reviews, messaging,
// orders, products, favorites, promos, system). `userId` is a generic
// recipient key: a buyer device UUID *or* a seller storeId — same identity
// convention already used by reviews/conversations (auth is a future sprint).
//
// New notification types are added by extending NOTIFICATION_TYPES below —
// no schema or route change required.

export const NOTIFICATION_TYPES = [
  "new_message",
  "new_order",
  "order_status_updated",
  "review_received",
  "product_approved",
  "product_rejected",
  "store_follow",
  "favorite_price_change",
  "promotional_campaign",
  "system_announcement",
  // ── Reservation events (Sprint G.2+) ───────────────────────────────────────
  // New types are added here; no schema migration required (type column is text).
  "reservation_created",   // Merchant receives when a buyer creates a reservation.
  "reservation_confirmed", // Buyer receives when the merchant confirms.
  "reservation_declined",  // Buyer receives when the merchant declines.
  "reservation_cancelled", // The other party receives on cancellation.
  "reservation_completed", // Buyer receives when the merchant marks the visit done.
  "reservation_expired",   // Buyer receives when a pending reservation auto-expires.
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const notificationsTable = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    /** Recipient key: buyer device UUID or seller storeId. */
    userId: text("user_id").notNull(),
    /** One of NOTIFICATION_TYPES — kept as free text so new types need no migration. */
    type: text("type").notNull(),
    titleAr: text("title_ar").notNull(),
    titleEn: text("title_en").notNull(),
    bodyAr: text("body_ar").notNull(),
    bodyEn: text("body_en").notNull(),
    /** Arbitrary structured payload (orderId, productId, storeId, conversationId, deepLink, ...). */
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    readStatus: boolean("read_status").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => [
    // Notification Center list: WHERE userId = ? ORDER BY createdAt DESC
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
    // Unread badge / mark-all-read: WHERE userId = ? AND readStatus = false
    index("notifications_user_read_idx").on(table.userId, table.readStatus),
  ],
);

export const insertNotificationSchema = createInsertSchema(notificationsTable);
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
