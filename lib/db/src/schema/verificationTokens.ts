import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

// ─── Verification token types ─────────────────────────────────────────────────

export const verificationTokenTypeEnum = pgEnum("verification_token_type", [
  "email_verify",
  "password_reset",
]);

export type VerificationTokenType =
  (typeof verificationTokenTypeEnum.enumValues)[number];

// ─── verification_tokens ──────────────────────────────────────────────────────
// Single-use tokens for email verification and password reset.
// Only the SHA-256 hash is stored; the raw token travels via email / deep-link.

export const verificationTokensTable = pgTable(
  "verification_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    /** SHA-256 hex digest of the raw token */
    tokenHash: text("token_hash").notNull().unique(),
    type: verificationTokenTypeEnum("type").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    /** Non-null once the token has been consumed */
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("verification_tokens_user_id_type_idx").on(table.userId, table.type),
    index("verification_tokens_expires_at_idx").on(table.expiresAt),
  ],
);

export const insertVerificationTokenSchema = createInsertSchema(
  verificationTokensTable,
);
export type InsertVerificationToken = z.infer<
  typeof insertVerificationTokenSchema
>;
export type VerificationToken = typeof verificationTokensTable.$inferSelect;
