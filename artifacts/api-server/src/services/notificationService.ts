import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { and, count, desc, eq } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export const NOTIFICATION_TYPES = [
  "reservation_created",
  "reservation_confirmed",
  "reservation_declined",
  "reservation_cancelled",
  "reservation_completed",
  "reservation_expired",
  "new_message",
  "review_received",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  metadata?: Record<string, unknown> | null;
  expiresAt?: Date | null;
}

// ─── DTO ─────────────────────────────────────────────────────────────────────

export function toNotificationDto(row: typeof notificationsTable.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    titleAr: row.titleAr,
    titleEn: row.titleEn,
    bodyAr: row.bodyAr,
    bodyEn: row.bodyEn,
    metadata: row.metadata ?? null,
    readStatus: row.readStatus,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  };
}

// ─── ID helper ────────────────────────────────────────────────────────────────

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function createNotification(input: CreateNotificationInput) {
  const [created] = await db
    .insert(notificationsTable)
    .values({
      id: generateId(),
      userId: input.userId,
      type: input.type,
      titleAr: input.titleAr,
      titleEn: input.titleEn,
      bodyAr: input.bodyAr,
      bodyEn: input.bodyEn,
      metadata: input.metadata ?? null,
      readStatus: false,
      expiresAt: input.expiresAt ?? null,
    })
    .returning();

  return created;
}

export async function listNotifications(userId: string) {
  return db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt));
}

export async function getNotification(id: string) {
  const [row] = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.id, id));
  return row;
}

/** Marks a notification read and returns the updated row, or undefined if not found. */
export async function markNotificationRead(id: string) {
  const [updated] = await db
    .update(notificationsTable)
    .set({ readStatus: true })
    .where(eq(notificationsTable.id, id))
    .returning();
  return updated;
}

export async function markAllNotificationsRead(userId: string) {
  await db
    .update(notificationsTable)
    .set({ readStatus: true })
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.readStatus, false)));
}

/** Deletes a notification and returns true if it existed, false otherwise. */
export async function deleteNotification(id: string): Promise<boolean> {
  const result = await db
    .delete(notificationsTable)
    .where(eq(notificationsTable.id, id))
    .returning({ id: notificationsTable.id });
  return result.length > 0;
}

export async function getUnreadCount(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.readStatus, false)));
  return row?.value ?? 0;
}
