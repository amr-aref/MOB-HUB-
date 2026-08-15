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
import { requireAuth } from "../middlewares/authenticate";

const router: IRouter = Router();

// All notification routes require an authenticated session.
// Recipient identity is ALWAYS derived from req.user.sub — client-supplied
// userId query/body params are ignored for authorization.
router.use(requireAuth);

// GET /notifications — list the authenticated user's notifications, newest first.
router.get("/notifications", async (req, res) => {
  const userId = req.user!.sub;
  const rows = await listNotifications(userId);
  res.json(rows.map(toNotificationDto));
});

// GET /notifications/unread-count — badge count for the authenticated user.
// Registered before /notifications/:id so "unread-count" isn't treated as an id.
router.get("/notifications/unread-count", async (req, res) => {
  const userId = req.user!.sub;
  const unreadCount = await getUnreadCount(userId);
  res.json({ unreadCount });
});

// PATCH /notifications/read-all — mark every notification read for the authenticated user.
router.patch("/notifications/read-all", async (req, res) => {
  const userId = req.user!.sub;
  await markAllNotificationsRead(userId);
  res.json({ success: true });
});

// GET /notifications/:id — fetch a single notification owned by the authenticated user.
// Returns 404 (not 403) when missing or not owned to reduce enumeration.
router.get("/notifications/:id", async (req, res) => {
  const userId = req.user!.sub;
  const row = await getNotification(req.params.id);

  if (!row || row.userId !== userId) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(toNotificationDto(row));
});

// PATCH /notifications/:id/read — mark a single notification read.
router.patch("/notifications/:id/read", async (req, res) => {
  const userId = req.user!.sub;
  const existing = await getNotification(req.params.id);

  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  const updated = await markNotificationRead(req.params.id);

  if (!updated) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(toNotificationDto(updated));
});

// DELETE /notifications/:id — delete a notification owned by the authenticated user.
router.delete("/notifications/:id", async (req, res) => {
  const userId = req.user!.sub;
  const existing = await getNotification(req.params.id);

  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "Notification not found" });
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
