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

// GET /notifications/:id
router.get("/notifications/:id", async (req, res) => {
  const row = await getNotification(req.params.id);

  if (!row) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(toNotificationDto(row));
});

// PATCH /notifications/:id/read — mark a single notification read.
router.patch("/notifications/:id/read", async (req, res) => {
  const existing = await getNotification(req.params.id);

  if (!existing) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  const updated = await markNotificationRead(req.params.id);
  res.json(toNotificationDto(updated));
});

// DELETE /notifications/:id
router.delete("/notifications/:id", async (req, res) => {
  const existing = await getNotification(req.params.id);

  if (!existing) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  await deleteNotification(req.params.id);
  res.status(204).send();
});

export default router;
