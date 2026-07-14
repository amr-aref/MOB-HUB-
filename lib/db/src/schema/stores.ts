import {
  boolean,
  integer,
  pgTable,
  real,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const storesTable = pgTable("stores", {
  id: text("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionAr: text("description_ar").notNull(),
  descriptionEn: text("description_en").notNull(),
  logoColor: text("logo_color").notNull(),
  logoInitial: text("logo_initial").notNull(),
  coverGradientFrom: text("cover_gradient_from").notNull(),
  coverGradientTo: text("cover_gradient_to").notNull(),
  rating: real("rating").notNull().default(0),
  reviewsCount: integer("reviews_count").notNull().default(0),
  governorate: text("governorate").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  addressAr: text("address_ar").notNull(),
  lat: real("lat").notNull().default(0),
  lng: real("lng").notNull().default(0),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp").notNull(),
  facebook: text("facebook"),
  instagram: text("instagram"),
  website: text("website"),
  workingHours: text("working_hours").notNull(),
  workingHoursAr: text("working_hours_ar").notNull(),
  isOpen: boolean("is_open").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  productsCount: integer("products_count").notNull().default(0),
  categories: text("categories").array().notNull().default([]),
});

export const insertStoreSchema = createInsertSchema(storesTable);
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof storesTable.$inferSelect;
