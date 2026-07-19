import { randomUUID } from "crypto";
import { db } from "@workspace/db";
import { auditLogsTable, authEventsTable } from "@workspace/db/schema";
import type { AuthEventType } from "@workspace/db/schema";
import { logger } from "../lib/logger";
import type { Request } from "express";

// ─── Audit log ────────────────────────────────────────────────────────────────

export interface AuditContext {
  actorId?: string;
  actorRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  req?: Pick<Request, "ip" | "headers" | "correlationId">;
}

/**
 * Write an immutable audit log entry.
 * Fire-and-forget — errors are logged but never propagate to the caller.
 */
export async function logAudit(ctx: AuditContext): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({
      id: `aud_${randomUUID()}`,
      actorId: ctx.actorId ?? null,
      actorRole: ctx.actorRole ?? null,
      action: ctx.action,
      resource: ctx.resource,
      resourceId: ctx.resourceId ?? null,
      metadata: ctx.metadata ?? null,
      ipAddress: ctx.req?.ip ?? null,
      userAgent:
        typeof ctx.req?.headers["user-agent"] === "string"
          ? ctx.req.headers["user-agent"]
          : null,
      correlationId: ctx.req?.correlationId ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Failed to write audit log");
  }
}

// ─── Auth event log ───────────────────────────────────────────────────────────

export interface AuthEventContext {
  userId?: string;
  event: AuthEventType;
  success: boolean;
  metadata?: Record<string, unknown>;
  req?: Pick<Request, "ip" | "headers" | "correlationId">;
}

/**
 * Write an authentication event entry.
 * Fire-and-forget — errors are logged but never propagate to the caller.
 */
export async function logAuthEvent(ctx: AuthEventContext): Promise<void> {
  try {
    await db.insert(authEventsTable).values({
      id: `aev_${randomUUID()}`,
      userId: ctx.userId ?? null,
      event: ctx.event,
      success: ctx.success,
      metadata: ctx.metadata ?? null,
      ipAddress: ctx.req?.ip ?? null,
      userAgent:
        typeof ctx.req?.headers["user-agent"] === "string"
          ? ctx.req.headers["user-agent"]
          : null,
      correlationId: ctx.req?.correlationId ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Failed to write auth event");
  }
}
