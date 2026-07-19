import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { sessionsTable } from "./sessions";

// ─── refresh_tokens ───────────────────────────────────────────────────────────
// Only the SHA-256 hash of each refresh token is stored.
// Token rotation: every /auth/refresh call revokes the used token and issues
// a fresh one — stored as a new row.  Revoked tokens are kept for audit until
// pruned by a background job.

export const refreshTokensTable = pgTable(
  "refresh_tokens",
  {
    id: text("id").primaryKey(),
    /** SHA-256 hex digest of the raw refresh token */
    tokenHash: text("token_hash").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    sessionId: text("session_id")
      .notNull()
      .references(() => sessionsTable.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    /** Non-null when the token was revoked (rotation or logout) */
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("refresh_tokens_user_id_idx").on(table.userId),
    index("refresh_tokens_session_id_idx").on(table.sessionId),
    index("refresh_tokens_expires_at_idx").on(table.expiresAt),
  ],
);

export const insertRefreshTokenSchema = createInsertSchema(refreshTokensTable);
export type InsertRefreshToken = z.infer<typeof insertRefreshTokenSchema>;
export type RefreshToken = typeof refreshTokensTable.$inferSelect;
