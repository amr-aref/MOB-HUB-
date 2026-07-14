import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { storesTable } from "./stores";
import { productsTable } from "./products";

export const reviewsTable = pgTable("reviews", {
  id: text("id").primaryKey(),
  storeId: text("store_id").references(() => storesTable.id, {
    onDelete: "cascade",
  }),
  productId: text("product_id").references(() => productsTable.id, {
    onDelete: "cascade",
  }),
  author: text("author").notNull(),
  authorAr: text("author_ar").notNull(),
  rating: integer("rating").notNull(),
  textAr: text("text_ar").notNull(),
  textEn: text("text_en").notNull(),
  date: text("date").notNull(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable);
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
