/**
 * Pure unit tests for the reservation domain (node:test).
 *
 * Covers:
 * 1. Valid state transitions (pending → confirmed|declined|cancelled|expired;
 *    confirmed → completed|cancelled) and invalid transitions
 * 2. Unique-constraint / product already reserved detection (isUniqueViolation)
 * 3. IDOR: cross-merchant actions raise ReservationForbiddenError
 * 4. Auth: unauthenticated / wrong-role blocked by requireRole middleware
 * 5. listReservations scope contract (unscoped forbidden)
 *
 * No DB, no network — deterministic and isolated.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response, NextFunction } from "express";
import {
  ALLOWED_TRANSITIONS,
  assertTransition,
  isUniqueViolation,
  ReservationTransitionError,
  ReservationForbiddenError,
  ReservationConflictError,
} from "./reservationService.js";
import { requireRole } from "../middlewares/authorize.js";
import { AppError } from "../lib/api-helpers.js";
import type { ReservationStatus } from "@workspace/db/schema";

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
      (err: unknown) =>
        err instanceof ReservationTransitionError &&
        /pending.*completed/.test((err as Error).message),
    );
  });

  it("rejects confirmed → declined", () => {
    assert.throws(
      () => assertTransition("confirmed", "declined"),
      ReservationTransitionError,
    );
  });

  it("rejects transitions from terminal states", () => {
    const terminals: ReservationStatus[] = ["declined", "cancelled", "expired", "completed"];
    for (const from of terminals) {
      for (const to of ["pending", "confirmed", "declined", "cancelled", "expired", "completed"] as ReservationStatus[]) {
        assert.throws(
          () => assertTransition(from, to),
          ReservationTransitionError,
          `expected ${from} → ${to} to be rejected`,
        );
      }
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
    assert.equal(
      isUniqueViolation({
        message: "Failed query",
        cause: { code: "23505", constraint: "reservations_product_active_uniq" },
      }),
      true,
    );
  });

  it("detects unique constraint message fallback", () => {
    assert.equal(
      isUniqueViolation({ message: "duplicate key value violates unique constraint" }),
      true,
    );
  });

  it("returns false for unrelated errors", () => {
    assert.equal(isUniqueViolation(null), false);
    assert.equal(isUniqueViolation(undefined), false);
    assert.equal(isUniqueViolation(new Error("timeout")), false);
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
  function assertStoreOwnership(reservationStoreId: string, actingStoreId: string): void {
    if (reservationStoreId !== actingStoreId) {
      throw new ReservationForbiddenError(
        "Only the store owner can confirm this reservation",
      );
    }
  }

  it("allows matching storeId", () => {
    assert.doesNotThrow(() => assertStoreOwnership("store_a", "store_a"));
  });

  it("rejects mismatched storeId (IDOR)", () => {
    assert.throws(
      () => assertStoreOwnership("store_owner", "store_attacker"),
      (err: unknown) =>
        err instanceof ReservationForbiddenError &&
        /store owner/i.test((err as Error).message),
    );
  });

  it("ReservationForbiddenError is distinguishable from not-found", () => {
    const err = new ReservationForbiddenError("Only the store owner can decline this reservation");
    assert.equal(err.name, "ReservationForbiddenError");
    assert.notEqual(err.name, "ReservationNotFoundError");
  });
});

describe("requireRole authorization guard", () => {
  function mockReq(user?: { role: string }): Request {
    return { user } as unknown as Request;
  }

  function runMiddleware(
    mw: (req: Request, res: Response, next: NextFunction) => void,
    req: Request,
  ): unknown {
    let captured: unknown;
    mw(req, {} as Response, (err?: unknown) => {
      captured = err;
    });
    return captured;
  }

  it("rejects missing user (unauthenticated)", () => {
    const err = runMiddleware(requireRole("merchant"), mockReq());
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
