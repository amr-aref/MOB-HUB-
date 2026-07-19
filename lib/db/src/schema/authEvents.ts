import { boolean, index, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── Auth event types ─────────────────────────────────────────────────────────

export const authEventTypeEnum = pgEnum("auth_event_type", [
  "register",
  "login",
  "logout",
  "token_refresh",
  "token_revoked",
  "password_changed",
  "password_reset_requested",
  "password_reset_completed",
  "email_verification_sent",
  "email_verified",
  "account_locked",
  "account_unlocked",
]);

export type AuthEventType = (typeof authEventTypeEnum.enumValues)[number];

// ─── auth_events ──────────────────────────────────────────────────────────────
// Security-focused log for every authentication action.
// Separate from audit_logs to allow different retention / alerting policies.

export const authEventsTable = pgTable(
  "auth_events",
  {
    id: text("id").primaryKey(),
    /** May be null for failed login attempts where userId is unknown */
    userId: text("user_id"),
    event: authEventTypeEnum("event").notNull(),
    success: boolean("success").notNull(),
    /** Extra context: device info, failure reason, token family, etc. */
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    correlationId: text("correlation_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("auth_events_user_id_idx").on(table.userId),
    index("auth_events_event_idx").on(table.event),
    index("auth_events_created_at_idx").on(table.createdAt),
  ],
);

export const insertAuthEventSchema = createInsertSchema(authEventsTable);
export type InsertAuthEvent = z.infer<typeof insertAuthEventSchema>;
export type AuthEvent = typeof authEventsTable.$inferSelect;
