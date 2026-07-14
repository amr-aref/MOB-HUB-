import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { storesTable } from "./stores";

export const dashboardStatsTable = pgTable("dashboard_stats", {
  id: serial("id").primaryKey(),
  storeId: text("store_id")
    .notNull()
    .references(() => storesTable.id, { onDelete: "cascade" }),
  views: integer("views").notNull().default(0),
  visitors: integer("visitors").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  reservations: integer("reservations").notNull().default(0),
  newReviews: integer("new_reviews").notNull().default(0),
  messagesCount: integer("messages_count").notNull().default(0),
  saved: integer("saved").notNull().default(0),
  trending: integer("trending").notNull().default(0),
  date: text("date").notNull(),
});

export const insertDashboardStatsSchema =
  createInsertSchema(dashboardStatsTable);
export type InsertDashboardStats = z.infer<typeof insertDashboardStatsSchema>;
export type DashboardStats = typeof dashboardStatsTable.$inferSelect;
