import type { Request, Response, NextFunction } from "express";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@workspace/db";
import { sessionsTable, usersTable } from "@workspace/db/schema";
import { verifyAccessToken, extractBearerToken } from "../lib/jwt";
import { AppError } from "../lib/api-helpers";

/**
 * Strict authentication. In addition to verifying the JWT, requireAuth checks
 * that the backing session still exists, has not expired, and belongs to an
 * active user. This makes logout, logout-all, suspension, and session revocation
 * take effect immediately for access-token requests.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    next(new AppError(401, "Authentication required", "UNAUTHORIZED"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const [session] = await db
      .select({
        sessionId: sessionsTable.id,
        userId: usersTable.id,
        isActive: usersTable.isActive,
      })
      .from(sessionsTable)
      .innerJoin(usersTable, eq(usersTable.id, sessionsTable.userId))
      .where(
        and(
          eq(sessionsTable.id, payload.sessionId),
          eq(sessionsTable.userId, payload.sub),
          gt(sessionsTable.expiresAt, new Date()),
        ),
      );

    if (!session || !session.isActive) {
      next(new AppError(401, "Session is no longer active", "SESSION_INVALID"));
      return;
    }

    req.user = payload;
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}

/**
 * Optional authentication. Invalid or revoked credentials are treated as
 * anonymous so public endpoints can safely support personalized responses.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const [session] = await db
      .select({ sessionId: sessionsTable.id, isActive: usersTable.isActive })
      .from(sessionsTable)
      .innerJoin(usersTable, eq(usersTable.id, sessionsTable.userId))
      .where(
        and(
          eq(sessionsTable.id, payload.sessionId),
          eq(sessionsTable.userId, payload.sub),
          gt(sessionsTable.expiresAt, new Date()),
        ),
      );

    if (session?.isActive) req.user = payload;
  } catch {
    // Continue as anonymous.
  }
  next();
}
