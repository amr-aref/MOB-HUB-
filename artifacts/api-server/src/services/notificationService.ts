import { db } from "@workspace/db";
import { notificationsTable, type NotificationType } from "@workspace/db/schema";
import { and, count, desc, eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Notification service (repository pattern)
// ---------------------------------------------------------------------------
// This is the single reusable entry point every module (reviews, messaging,
// orders, products, favorites, promos...) uses to emit notifications. Route
// handlers and future business logic must call `createNotification()`
// instead of writing to `notificationsTable` directly — this keeps the
// notification schema/DB details out of unrelated feature code and gives us
// one place to add fan-out (push notifications, websockets, etc.) later.
// ---------------------------------------------------------------------------

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

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

/** Create a notification for a recipient (buyer device UUID or seller storeId). */
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

export async function deleteNotification(id: string) {
  await db.delete(notificationsTable).where(eq(notificationsTable.id, id));
}

export async function getUnreadCount(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.readStatus, false)));
  return row?.value ?? 0;
}
