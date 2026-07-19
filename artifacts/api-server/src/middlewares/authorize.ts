import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/api-helpers";
import type { UserRole } from "@workspace/db/schema";

/**
 * RBAC middleware factory.
 *
 * Usage:
 *   router.post("/dashboard/products", requireAuth, requireRole("merchant", "admin"), handler)
 *
 * Always compose with requireAuth first — requireRole assumes req.user is set.
 */
export function requireRole(
  ...allowedRoles: UserRole[]
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError(401, "Authentication required", "UNAUTHORIZED"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          403,
          `Access denied. Required role: ${allowedRoles.join(" or ")}`,
          "FORBIDDEN",
        ),
      );
    }
    next();
  };
}

/**
 * Ownership guard — verifies that req.user.sub matches the target userId.
 * Admins bypass the check.
 *
 * Usage:
 *   requireOwnership((req) => req.params.userId)
 */
export function requireOwnership(
  getUserId: (req: Request) => string | undefined,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError(401, "Authentication required", "UNAUTHORIZED"));
    }
    if (req.user.role === "admin") return next();

    const targetUserId = getUserId(req);
    if (!targetUserId || req.user.sub !== targetUserId) {
      return next(new AppError(403, "Access denied", "FORBIDDEN"));
    }
    next();
  };
}
