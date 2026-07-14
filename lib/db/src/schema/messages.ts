import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { storesTable } from "./stores";

export const messagesTable = pgTable("messages", {
  id: text("id").primaryKey(),
  storeId: text("store_id")
    .notNull()
    .references(() => storesTable.id, { onDelete: "cascade" }),
  customer: text("customer").notNull(),
  productAr: text("product_ar").notNull(),
  productEn: text("product_en").notNull(),
  timeAr: text("time_ar").notNull(),
  timeEn: text("time_en").notNull(),
  status: text("status").notNull(),
  unread: integer("unread").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messagesTable);
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;
