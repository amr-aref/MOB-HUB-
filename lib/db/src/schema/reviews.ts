import { boolean, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { storesTable } from "./stores";
import { productsTable } from "./products";

export const reviewsTable = pgTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id").references(() => storesTable.id, {
      onDelete: "cascade",
    }),
    productId: text("product_id").references(() => productsTable.id, {
      onDelete: "cascade",
    }),
    /** Device-based pseudo user ID (auth is a future sprint) */
    userId: text("user_id"),
    author: text("author").notNull(),
    authorAr: text("author_ar").notNull(),
    rating: integer("rating").notNull(),
    /** Optional short title for the review */
    title: text("title").notNull().default(""),
    textAr: text("text_ar").notNull(),
    textEn: text("text_en").notNull(),
    /** Human-readable date string kept for display compatibility */
    date: text("date").notNull(),
    /** Review lifecycle: active | pending | flagged */
    status: text("status").notNull().default("active"),
    /** Architecture-ready: helpful votes counter (Sprint B+) */
    helpfulCount: integer("helpful_count").notNull().default(0),
    /** Architecture-ready: verified purchase flag (Sprint C+) */
    verifiedPurchase: boolean("verified_purchase").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // recalculateStoreRating + GET /stores/:id/reviews: filter by storeId + status
    index("reviews_store_id_status_idx").on(table.storeId, table.status),
    // Duplicate review check: storeId + userId
    index("reviews_store_id_user_id_idx").on(table.storeId, table.userId),
    // Future product reviews
    index("reviews_product_id_idx").on(table.productId),
  ],
);

export const insertReviewSchema = createInsertSchema(reviewsTable);
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
