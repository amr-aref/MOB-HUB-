import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── audit_logs ────────────────────────────────────────────────────────────────
// Immutable event log for security-relevant resource mutations.
// actor may be a user id, "system", or "anonymous".

export const auditLogsTable = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    /** User who performed the action (null = unauthenticated) */
    actorId: text("actor_id"),
    actorRole: text("actor_role"),
    /** High-level action label, e.g. "product.created", "review.deleted" */
    action: text("action").notNull(),
    /** Resource type, e.g. "product", "review", "user" */
    resource: text("resource").notNull(),
    resourceId: text("resource_id"),
    /** Arbitrary structured context (diff, query params, etc.) */
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    /** Injected by correlationId middleware */
    correlationId: text("correlation_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_actor_id_idx").on(table.actorId),
    index("audit_logs_resource_idx").on(table.resource, table.resourceId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);

export const insertAuditLogSchema = createInsertSchema(auditLogsTable);
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogsTable.$inferSelect;
