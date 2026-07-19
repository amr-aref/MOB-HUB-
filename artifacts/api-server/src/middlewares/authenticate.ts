import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, extractBearerToken } from "../lib/jwt";
import { AppError } from "../lib/api-helpers";

/**
 * Strict authentication — rejects the request with 401 if no valid Bearer
 * token is present.  Sets req.user on success.
 */
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    return next(new AppError(401, "Authentication required", "UNAUTHORIZED"));
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}

/**
 * Optional authentication — if a valid token is present req.user is set;
 * if absent or invalid, the request continues as anonymous.
 * Use on endpoints that behave differently for authenticated vs anonymous users.
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = extractBearerToken(req.headers.authorization);
  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch {
      // Invalid token on optional auth — proceed as anonymous
    }
  }
  next();
}
