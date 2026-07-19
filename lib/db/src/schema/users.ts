import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── Role enum ────────────────────────────────────────────────────────────────
// Stored in the DB as a PG enum for referential integrity.
// Extend here when new roles are needed — no other files need changing for
// pure role additions (middleware uses the enum values, not hardcoded strings).

export const userRoleEnum = pgEnum("user_role", [
  "buyer",
  "merchant",
  "moderator",
  "admin",
]);

export type UserRole = (typeof userRoleEnum.enumValues)[number];

// ─── users ────────────────────────────────────────────────────────────────────

export const usersTable = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    nameAr: text("name_ar").notNull(),
    role: userRoleEnum("role").notNull().default("buyer"),
    /** FK to stores.id — required when role === "merchant" */
    storeId: text("store_id"),
    isEmailVerified: boolean("is_email_verified").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_role_idx").on(table.role),
    index("users_store_id_idx").on(table.storeId),
  ],
);

export const insertUserSchema = createInsertSchema(usersTable);
export const selectUserSchema = createSelectSchema(usersTable);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
/** Safe user type — never include passwordHash in API responses */
export type PublicUser = Omit<User, "passwordHash">;
