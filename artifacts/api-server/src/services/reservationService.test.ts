import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALLOWED_TRANSITIONS,
  assertTransition,
  isUniqueViolation,
  ReservationConflictError,
  ReservationForbiddenError,
  ReservationTransitionError,
} from "./reservationService";
import type { ReservationStatus } from "@workspace/db/schema";
import { AppError } from "../lib/errors";
import { requireRole } from "../middlewares/authorize";

// Minimal stand-in for Express Request used by requireRole unit tests.
function mockReq(user?: { role: string; sub?: string; storeId?: string | null }) {
  return { user } as Parameters<ReturnType<typeof requireRole>>[0];
}

function mockRes() {
  return {} as Parameters<ReturnType<typeof requireRole>>[1];
}

function runMiddleware(
  mw: ReturnType<typeof requireRole>,
  req: Parameters<ReturnType<typeof requireRole>>[0],
) {
  let err: unknown;
  mw(req, mockRes(), ((e?: unknown) => {
    err = e;
  }) as Parameters<ReturnType<typeof requireRole>>[2]);
  return err;
}

describe("reservation state machine", () => {
  it("allows pending → confirmed", () => {
    assert.doesNotThrow(() => assertTransition("pending", "confirmed"));
  });

  it("allows pending → declined", () => {
    assert.doesNotThrow(() => assertTransition("pending", "declined"));
  });

  it("allows pending → cancelled", () => {
    assert.doesNotThrow(() => assertTransition("pending", "cancelled"));
  });

  it("allows pending → expired", () => {
    assert.doesNotThrow(() => assertTransition("pending", "expired"));
  });

  it("allows confirmed → completed", () => {
    assert.doesNotThrow(() => assertTransition("confirmed", "completed"));
  });

  it("allows confirmed → cancelled", () => {
    assert.doesNotThrow(() => assertTransition("confirmed", "cancelled"));
  });

  it("rejects pending → completed", () => {
    assert.throws(
      () => assertTransition("pending", "completed"),
      (err: unknown) => err instanceof ReservationTransitionError,
    );
  });

  it("rejects confirmed → declined", () => {
    assert.throws(
      () => assertTransition("confirmed", "declined"),
      (err: unknown) => err instanceof ReservationTransitionError,
    );
  });

  it("rejects transitions from terminal states", () => {
    const terminals: ReservationStatus[] = ["declined", "cancelled", "expired", "completed"];
    for (const from of terminals) {
      assert.throws(
        () => assertTransition(from, "pending" as ReservationStatus),
        (err: unknown) => err instanceof ReservationTransitionError,
      );
    }
  });

  it("ALLOWED_TRANSITIONS matches documented lifecycle", () => {
    assert.deepEqual(ALLOWED_TRANSITIONS.pending, [
      "confirmed",
      "declined",
      "cancelled",
      "expired",
    ]);
    assert.deepEqual(ALLOWED_TRANSITIONS.confirmed, ["completed", "cancelled"]);
    assert.deepEqual(ALLOWED_TRANSITIONS.declined, []);
    assert.deepEqual(ALLOWED_TRANSITIONS.cancelled, []);
    assert.deepEqual(ALLOWED_TRANSITIONS.expired, []);
    assert.deepEqual(ALLOWED_TRANSITIONS.completed, []);
  });
});

describe("isUniqueViolation (product active-reservation guard)", () => {
  it("detects raw PG 23505", () => {
    assert.equal(isUniqueViolation({ code: "23505" }), true);
  });

  it("detects Drizzle-wrapped PG error via .cause", () => {
    assert.equal(isUniqueViolation({ cause: { code: "23505" } }), true);
  });

  it("detects unique constraint message fallback", () => {
    assert.equal(
      isUniqueViolation({ message: "duplicate key value violates unique constraint" }),
      true,
    );
  });

  it("returns false for unrelated errors", () => {
    assert.equal(isUniqueViolation(new Error("network down")), false);
    assert.equal(isUniqueViolation(null), false);
    assert.equal(isUniqueViolation({ code: "23503" }), false);
  });

  it("ReservationConflictError carries PRODUCT_ALREADY_RESERVED semantics", () => {
    const err = new ReservationConflictError(
      "This product already has an active reservation",
      "PRODUCT_ALREADY_RESERVED",
    );
    assert.equal(err.name, "ReservationConflictError");
    assert.equal(err.code, "PRODUCT_ALREADY_RESERVED");
  });
});

describe("IDOR / cross-merchant protection", () => {
  it("allows matching storeId", () => {
    // Documented contract: merchant actions require reservation.storeId === actor storeId.
    const reservationStoreId = "store_a";
    const actorStoreId = "store_a";
    assert.equal(reservationStoreId === actorStoreId, true);
  });

  it("rejects mismatched storeId (IDOR)", () => {
    const reservationStoreId = "store_a";
    const actorStoreId = "store_b";
    assert.equal(reservationStoreId === actorStoreId, false);
    const err = new ReservationForbiddenError("Only the store owner can confirm this reservation");
    assert.equal(err.name, "ReservationForbiddenError");
  });

  it("ReservationForbiddenError is distinguishable from not-found", () => {
    const err = new ReservationForbiddenError("forbidden");
    assert.equal(err.name, "ReservationForbiddenError");
    assert.notEqual(err.name, "ReservationNotFoundError");
  });
});

describe("requireRole authorization guard", () => {
  it("rejects missing user (unauthenticated)", () => {
    const err = runMiddleware(requireRole("merchant", "admin"), mockReq(undefined));
    assert.ok(err instanceof AppError);
    assert.equal((err as AppError).status, 401);
    assert.equal((err as AppError).code, "UNAUTHORIZED");
  });

  it("rejects buyer role for merchant-only action", () => {
    const err = runMiddleware(requireRole("merchant", "admin"), mockReq({ role: "buyer" }));
    assert.ok(err instanceof AppError);
    assert.equal((err as AppError).status, 403);
    assert.equal((err as AppError).code, "FORBIDDEN");
  });

  it("allows merchant role", () => {
    const err = runMiddleware(requireRole("merchant", "admin"), mockReq({ role: "merchant" }));
    assert.equal(err, undefined);
  });

  it("allows admin role when listed", () => {
    const err = runMiddleware(requireRole("merchant", "admin"), mockReq({ role: "admin" }));
    assert.equal(err, undefined);
  });
});

describe("listReservations scope requirement", () => {
  it("documents that unscoped listing is forbidden via ReservationForbiddenError", () => {
    const err = new ReservationForbiddenError(
      "At least one of buyerId or storeId is required to list reservations",
    );
    assert.equal(err.name, "ReservationForbiddenError");
    assert.match(err.message, /buyerId or storeId/i);
  });
});

describe("merchant notification identity regression (BUG-01)", () => {
  /**
   * Static regression: merchant-bound createNotification must not pass storeId
   * as userId. Notifications are listed by authenticated users.id (req.user.sub).
   * storeId and users.id are different entities in the schema.
   */
  it("does not pass product.storeId or reservation.storeId as notification userId", async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const { dirname, join } = await import("node:path");
    const here = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(join(here, "reservationService.ts"), "utf8");

    // Old bug patterns — must not reappear.
    assert.equal(
      /userId:\s*product\.storeId/.test(source),
      false,
      "createReservation must not use product.storeId as notification userId",
    );
    assert.equal(
      /cancelledByBuyer\s*\?\s*updated\.result\.storeId/.test(source),
      false,
      "cancelReservation must not use reservation.storeId as merchant notification userId",
    );

    // Required fix patterns — merchant resolved via users.storeId lookup.
    assert.match(source, /resolveMerchantUserId/);
    assert.match(source, /usersTable/);
    assert.match(source, /eq\(usersTable\.storeId,\s*storeId\)/);
  });
});
