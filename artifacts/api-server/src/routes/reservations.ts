import { Router, type IRouter } from "express";
import type { Response } from "express";
import {
  createReservation,
  getReservation,
  listReservations,
  confirmReservation,
  declineReservation,
  cancelReservation,
  completeReservation,
  getReservationHistory,
  ReservationNotFoundError,
  ReservationConflictError,
  ReservationForbiddenError,
  ReservationTransitionError,
} from "../services/reservationService";
import { RESERVATION_STATUSES } from "@workspace/db/schema";
import { requireAuth } from "../middlewares/authenticate";
import { AppError } from "../lib/api-helpers";

const router: IRouter = Router();

function handleServiceError(err: unknown, res: Response): void {
  if (err instanceof ReservationNotFoundError) { res.status(404).json({ error: err.message }); return; }
  if (err instanceof ReservationConflictError) { res.status(409).json({ error: err.message, code: err.code }); return; }
  if (err instanceof ReservationForbiddenError) { res.status(403).json({ error: err.message }); return; }
  if (err instanceof ReservationTransitionError) { res.status(422).json({ error: err.message, code: "INVALID_TRANSITION" }); return; }
  throw err;
}

function requireMerchant(req: Parameters<typeof requireAuth>[0]): string {
  if (!req.user || !["merchant", "admin", "moderator"].includes(req.user.role)) {
    throw new AppError(403, "Merchant access required", "FORBIDDEN");
  }
  if (!req.user.storeId && req.user.role !== "admin" && req.user.role !== "moderator") {
    throw new AppError(403, "A store is required for merchant actions", "STORE_REQUIRED");
  }
  return req.user.storeId ?? "";
}

function validateLimit(raw: unknown): number {
  const n = parseInt(String(raw), 10);
  return isNaN(n) || n < 1 ? 20 : Math.min(n, 50);
}

function validateOffset(raw: unknown): number {
  const n = parseInt(String(raw), 10);
  return isNaN(n) || n < 0 ? 0 : n;
}

router.use(requireAuth);

// MOB HUB is reservation-only. This endpoint never creates an order or payment.
// The authenticated session is the authoritative buyer identity.
router.post("/products/:id/reserve", async (req, res, next) => {
  const buyerNotes = typeof req.body?.buyerNotes === "string"
    ? req.body.buyerNotes.trim().slice(0, 500)
    : undefined;
  try {
    const dto = await createReservation({ productId: req.params.id, buyerId: req.user!.sub, buyerNotes });
    res.status(201).json(dto);
  } catch (err) {
    try { handleServiceError(err, res); } catch (unknownError) { next(unknownError); }
  }
});

router.get("/reservations", async (req, res, next) => {
  const status = typeof req.query.status === "string" ? req.query.status.trim() : undefined;
  if (status && !RESERVATION_STATUSES.includes(status as (typeof RESERVATION_STATUSES)[number])) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${RESERVATION_STATUSES.join(", ")}` });
    return;
  }

  const isMerchant = ["merchant", "admin", "moderator"].includes(req.user!.role);
  const requestedStoreId = typeof req.query.storeId === "string" ? req.query.storeId.trim() : undefined;
  if (requestedStoreId && !isMerchant) {
    res.status(403).json({ error: "Merchant access required" });
    return;
  }
  if (requestedStoreId && req.user!.role === "merchant" && requestedStoreId !== req.user!.storeId) {
    res.status(403).json({ error: "You can only access your own store reservations" });
    return;
  }

  // Ignore client-supplied buyerId completely. Existing mobile builds still send
  // a device UUID; the authenticated session must remain the source of truth.
  const buyerId = requestedStoreId ? undefined : req.user!.sub;
  const storeId = requestedStoreId ?? (isMerchant ? req.user!.storeId ?? undefined : undefined);

  try {
    const dtos = await listReservations({ buyerId, storeId, status, limit: validateLimit(req.query.limit), offset: validateOffset(req.query.offset) });
    res.json(dtos);
  } catch (err) {
    try { handleServiceError(err, res); } catch (unknownError) { next(unknownError); }
  }
});

router.get("/reservations/:id", async (req, res, next) => {
  try {
    const options = ["merchant", "admin", "moderator"].includes(req.user!.role)
      ? { buyerId: req.user!.sub, storeId: req.user!.storeId ?? undefined }
      : { buyerId: req.user!.sub };
    res.json(await getReservation(req.params.id, options));
  } catch (err) {
    try { handleServiceError(err, res); } catch (unknownError) { next(unknownError); }
  }
});

router.get("/reservations/:id/history", async (req, res, next) => {
  try {
    const options = ["merchant", "admin", "moderator"].includes(req.user!.role)
      ? { buyerId: req.user!.sub, storeId: req.user!.storeId ?? undefined }
      : { buyerId: req.user!.sub };
    res.json(await getReservationHistory(req.params.id, options));
  } catch (err) {
    try { handleServiceError(err, res); } catch (unknownError) { next(unknownError); }
  }
});

router.patch("/reservations/:id/confirm", async (req, res, next) => {
  try {
    const storeId = requireMerchant(req);
    if (!storeId) { res.status(403).json({ error: "A store is required" }); return; }
    res.json(await confirmReservation(req.params.id, storeId));
  } catch (err) {
    try { handleServiceError(err, res); } catch (unknownError) { next(unknownError); }
  }
});

router.patch("/reservations/:id/decline", async (req, res, next) => {
  try {
    const storeId = requireMerchant(req);
    if (!storeId) { res.status(403).json({ error: "A store is required" }); return; }
    const cancellationReason = typeof req.body?.cancellationReason === "string" ? req.body.cancellationReason.trim().slice(0, 500) : undefined;
    res.json(await declineReservation(req.params.id, { storeId, cancellationReason }));
  } catch (err) {
    try { handleServiceError(err, res); } catch (unknownError) { next(unknownError); }
  }
});

router.patch("/reservations/:id/cancel", async (req, res, next) => {
  const isMerchant = ["merchant", "admin", "moderator"].includes(req.user!.role);
  const cancellationReason = typeof req.body?.cancellationReason === "string" ? req.body.cancellationReason.trim().slice(0, 500) : undefined;
  try {
    res.json(await cancelReservation(req.params.id, {
      buyerId: req.user!.sub,
      storeId: isMerchant ? req.user!.storeId ?? undefined : undefined,
      cancellationReason,
    }));
  } catch (err) {
    try { handleServiceError(err, res); } catch (unknownError) { next(unknownError); }
  }
});

router.patch("/reservations/:id/complete", async (req, res, next) => {
  try {
    const storeId = requireMerchant(req);
    if (!storeId) { res.status(403).json({ error: "A store is required" }); return; }
    res.json(await completeReservation(req.params.id, storeId));
  } catch (err) {
    try { handleServiceError(err, res); } catch (unknownError) { next(unknownError); }
  }
});

export default router;
