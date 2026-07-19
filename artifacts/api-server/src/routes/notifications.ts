import { Router, type IRouter } from "express";
import {
  deleteNotification,
  getNotification,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  toNotificationDto,
} from "../services/notificationService";

const router: IRouter = Router();

// GET /notifications?userId= — list a recipient's notifications, newest first.
router.get("/notifications", async (req, res) => {
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;

  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  const rows = await listNotifications(userId);
  res.json(rows.map(toNotificationDto));
});

// GET /notifications/unread-count?userId= — badge count.
// Registered before /notifications/:id so "unread-count" isn't treated as an id.
router.get("/notifications/unread-count", async (req, res) => {
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;

  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  const unreadCount = await getUnreadCount(userId);
  res.json({ unreadCount });
});

// PATCH /notifications/read-all — mark every notification read for a recipient.
// Body: { userId }
router.patch("/notifications/read-all", async (req, res) => {
  const { userId } = req.body as { userId?: string };

  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  await markAllNotificationsRead(userId);
  res.json({ success: true });
});

// GET /notifications/:id?userId= — fetch a single notification.
// Requires userId query param; returns 403 if the notification belongs to a different user.
router.get("/notifications/:id", async (req, res) => {
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;

  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  const row = await getNotification(req.params.id);

  if (!row) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  if (row.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(toNotificationDto(row));
});

// PATCH /notifications/:id/read?userId= — mark a single notification read.
// Requires userId query param; 403 if the notification belongs to a different user.
router.patch("/notifications/:id/read", async (req, res) => {
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;

  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  const existing = await getNotification(req.params.id);

  if (!existing) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  if (existing.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const updated = await markNotificationRead(req.params.id);

  if (!updated) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(toNotificationDto(updated));
});

// DELETE /notifications/:id?userId= — delete a notification.
// Requires userId query param; 403 if the notification belongs to a different user.
router.delete("/notifications/:id", async (req, res) => {
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;

  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  const existing = await getNotification(req.params.id);

  if (!existing) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  if (existing.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const deleted = await deleteNotification(req.params.id);

  if (!deleted) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.status(204).send();
});

export default router;
