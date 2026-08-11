import type { Request, Response, NextFunction } from "express";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@workspace/db";
import { sessionsTable, usersTable } from "@workspace/db/schema";
import { verifyAccessToken, extractBearerToken } from "../lib/jwt";
import { AppError } from "../lib/api-helpers";

async function resolveActiveUser(payload: ReturnType<typeof verifyAccessToken>) {
  const [session] = await db
    .select({
      sessionId: sessionsTable.id,
      userId: usersTable.id,
      email: usersTable.email,
      role: usersTable.role,
      storeId: usersTable.storeId,
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

  if (!session || !session.isActive) return null;

  return {
    sub: session.userId,
    email: session.email,
    role: session.role,
    sessionId: session.sessionId,
    ...(session.storeId ? { storeId: session.storeId } : {}),
  };
}

/**
 * Strict authentication. JWT signature/claims are verified and the backing
 * session plus current database user state are checked on every protected request.
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
    const user = await resolveActiveUser(payload);
    if (!user) {
      next(new AppError(401, "Session is no longer active", "SESSION_INVALID"));
      return;
    }
    req.user = user;
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}

/**
 * Optional authentication. Invalid, revoked, expired, or suspended credentials
 * are treated as anonymous.
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
    const user = await resolveActiveUser(payload);
    if (user) req.user = user;
  } catch {
    // Continue as anonymous.
  }
  next();
}
