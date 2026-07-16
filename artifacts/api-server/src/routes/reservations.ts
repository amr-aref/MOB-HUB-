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
  ReservationNotFoundError,
  ReservationConflictError,
  ReservationForbiddenError,
  ReservationTransitionError,
} from "../services/reservationService";
import { RESERVATION_STATUSES } from "@workspace/db/schema";

const router: IRouter = Router();

// ─── Error mapper ─────────────────────────────────────────────────────────────
// Translates service-layer domain errors to HTTP responses. Keeps all HTTP
// concerns out of the service layer (which only throws typed domain errors).

function handleServiceError(err: unknown, res: Response): void {
  if (err instanceof ReservationNotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  if (err instanceof ReservationConflictError) {
    res.status(409).json({ error: err.message, code: err.code });
    return;
  }
  if (err instanceof ReservationForbiddenError) {
    res.status(403).json({ error: err.message });
    return;
  }
  if (err instanceof ReservationTransitionError) {
    res.status(422).json({ error: err.message, code: "INVALID_TRANSITION" });
    return;
  }
  throw err; // Re-throw unknown errors — the global errorHandler catches them.
}

// ─── Input validators ─────────────────────────────────────────────────────────

function requireString(value: unknown, field: string): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return null;
}

function validateLimit(raw: unknown): number {
  const n = parseInt(String(raw), 10);
  return isNaN(n) || n < 1 ? 20 : Math.min(n, 50);
}

function validateOffset(raw: unknown): number {
  const n = parseInt(String(raw), 10);
  return isNaN(n) || n < 0 ? 0 : n;
}

// ─── POST /products/:id/reserve ───────────────────────────────────────────────
// Buyer creates a reservation for a product.
// Body: { buyerId, buyerNotes? }

router.post("/products/:id/reserve", async (req, res) => {
  const productId = req.params.id;
  const body = req.body as Record<string, unknown>;

  const buyerId = requireString(body.buyerId, "buyerId");
  if (!buyerId) {
    res.status(400).json({ error: "buyerId is required" });
    return;
  }

  const buyerNotes = typeof body.buyerNotes === "string" ? body.buyerNotes.trim().slice(0, 500) : undefined;

  try {
    const dto = await createReservation({ productId, buyerId, buyerNotes });
    res.status(201).json(dto);
  } catch (err) {
    handleServiceError(err, res as any);
  }
});

// ─── GET /reservations ────────────────────────────────────────────────────────
// List reservations for a buyer (buyerId) or merchant (storeId).
// At least one of buyerId or storeId is required.
// Optional filters: status, limit, offset.

router.get("/reservations", async (req, res) => {
  const q = req.query as Record<string, string | undefined>;
  const buyerId = requireString(q.buyerId, "buyerId") ?? undefined;
  const storeId = requireString(q.storeId, "storeId") ?? undefined;

  if (!buyerId && !storeId) {
    res.status(400).json({ error: "At least one of buyerId or storeId is required" });
    return;
  }

  const status = requireString(q.status, "status") ?? undefined;

  if (status && !RESERVATION_STATUSES.includes(status as (typeof RESERVATION_STATUSES)[number])) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${RESERVATION_STATUSES.join(", ")}` });
    return;
  }

  const limit = validateLimit(q.limit);
  const offset = validateOffset(q.offset);

  try {
    const dtos = await listReservations({ buyerId, storeId, status, limit, offset });
    res.json(dtos);
  } catch (err) {
    handleServiceError(err, res as any);
  }
});

// ─── GET /reservations/:id ────────────────────────────────────────────────────
// Get a single reservation by ID.
// Requires buyerId or storeId for access control (returns 404 if not a participant).

router.get("/reservations/:id", async (req, res) => {
  const { id } = req.params;
  const q = req.query as Record<string, string | undefined>;

  const buyerId = requireString(q.buyerId, "buyerId") ?? undefined;
  const storeId = requireString(q.storeId, "storeId") ?? undefined;

  try {
    const dto = await getReservation(id, { buyerId, storeId });
    res.json(dto);
  } catch (err) {
    handleServiceError(err, res as any);
  }
});

// ─── PATCH /reservations/:id/confirm ─────────────────────────────────────────
// Merchant confirms a pending reservation.
// Body: { storeId }

router.patch("/reservations/:id/confirm", async (req, res) => {
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;

  const storeId = requireString(body.storeId, "storeId");
  if (!storeId) {
    res.status(400).json({ error: "storeId is required" });
    return;
  }

  try {
    const dto = await confirmReservation(id, storeId);
    res.json(dto);
  } catch (err) {
    handleServiceError(err, res as any);
  }
});

// ─── PATCH /reservations/:id/decline ─────────────────────────────────────────
// Merchant declines a pending reservation.
// Body: { storeId, cancellationReason? }

router.patch("/reservations/:id/decline", async (req, res) => {
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;

  const storeId = requireString(body.storeId, "storeId");
  if (!storeId) {
    res.status(400).json({ error: "storeId is required" });
    return;
  }

  const cancellationReason =
    typeof body.cancellationReason === "string"
      ? body.cancellationReason.trim().slice(0, 500)
      : undefined;

  try {
    const dto = await declineReservation(id, { storeId, cancellationReason });
    res.json(dto);
  } catch (err) {
    handleServiceError(err, res as any);
  }
});

// ─── PATCH /reservations/:id/cancel ──────────────────────────────────────────
// Cancel a reservation. Either the buyer or the merchant may cancel.
// Body: { buyerId?, storeId?, cancellationReason? }
// At least one of buyerId or storeId is required.

router.patch("/reservations/:id/cancel", async (req, res) => {
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;

  const buyerId = requireString(body.buyerId, "buyerId") ?? undefined;
  const storeId = requireString(body.storeId, "storeId") ?? undefined;

  if (!buyerId && !storeId) {
    res.status(400).json({ error: "Either buyerId or storeId is required" });
    return;
  }

  const cancellationReason =
    typeof body.cancellationReason === "string"
      ? body.cancellationReason.trim().slice(0, 500)
      : undefined;

  try {
    const dto = await cancelReservation(id, { buyerId, storeId, cancellationReason });
    res.json(dto);
  } catch (err) {
    handleServiceError(err, res as any);
  }
});

// ─── PATCH /reservations/:id/complete ────────────────────────────────────────
// Merchant marks a confirmed reservation as completed (customer visited the store).
// Body: { storeId }

router.patch("/reservations/:id/complete", async (req, res) => {
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;

  const storeId = requireString(body.storeId, "storeId");
  if (!storeId) {
    res.status(400).json({ error: "storeId is required" });
    return;
  }

  try {
    const dto = await completeReservation(id, storeId);
    res.json(dto);
  } catch (err) {
    handleServiceError(err, res as any);
  }
});

export default router;
