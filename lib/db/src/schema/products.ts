import {
  boolean,
  index,
  integer,
  pgTable,
  real,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { storesTable } from "./stores";

export const productsTable = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => storesTable.id, { onDelete: "cascade" }),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull(),
    descriptionAr: text("description_ar").notNull(),
    descriptionEn: text("description_en").notNull(),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    price: integer("price").notNull(),
    discountPrice: integer("discount_price"),
    category: text("category").notNull(),
    condition: text("condition").notNull().default("new"),
    inStock: boolean("in_stock").notNull().default(true),
    warranty: text("warranty").notNull(),
    warrantyAr: text("warranty_ar").notNull(),
    colors: text("colors").array().notNull().default([]),
    storage: text("storage").array(),
    ram: text("ram").array(),
    imageColor: text("image_color").notNull(),
    rating: real("rating").notNull().default(0),
    reviewsCount: integer("reviews_count").notNull().default(0),
    isNew: boolean("is_new").notNull().default(false),
    isBestSeller: boolean("is_best_seller").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
  },
  (table) => [
    index("products_store_id_idx").on(table.storeId),
    index("products_category_idx").on(table.category),
    index("products_is_new_idx").on(table.isNew),
    index("products_is_best_seller_idx").on(table.isBestSeller),
    index("products_is_featured_idx").on(table.isFeatured),
  ],
);

export const insertProductSchema = createInsertSchema(productsTable);
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
