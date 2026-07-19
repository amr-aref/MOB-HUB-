import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";
import { AppError } from "../lib/api-helpers";

// ─── PostgreSQL error codes ────────────────────────────────────────────────────
const PG_UNIQUE_VIOLATION = "23505";
const PG_FOREIGN_KEY_VIOLATION = "23503";
const PG_CHECK_VIOLATION = "23514";
const PG_NOT_NULL_VIOLATION = "23502";

interface DbErrorResponse {
  status: number;
  message: string;
  code: string;
}

/**
 * Map a Drizzle/pg error to a safe client-facing response.
 * Drizzle wraps PG errors: the `code` field lives in `err.cause.code`.
 */
function classifyDbError(err: unknown): DbErrorResponse | null {
  if (typeof err !== "object" || err === null) return null;
  const cause = (err as Record<string, unknown>).cause as
    | Record<string, unknown>
    | undefined;
  const pgCode = typeof cause?.code === "string" ? cause.code : undefined;

  switch (pgCode) {
    case PG_UNIQUE_VIOLATION:
      return {
        status: 409,
        message: "A record with this value already exists",
        code: "DUPLICATE",
      };
    case PG_FOREIGN_KEY_VIOLATION:
      return {
        status: 400,
        message: "Referenced resource does not exist",
        code: "INVALID_REFERENCE",
      };
    case PG_CHECK_VIOLATION:
    case PG_NOT_NULL_VIOLATION:
      return { status: 400, message: "Invalid data provided", code: "INVALID_DATA" };
    default:
      return null;
  }
}

/**
 * Global Express error-handling middleware.
 *
 * Error classification (in priority order):
 *  1. AppError — intentional application errors; 4xx are not stack-traced.
 *  2. Known PostgreSQL constraint violations → safe 4xx client message.
 *  3. Express-style { status, message } objects (e.g. express-rate-limit).
 *  4. Anything else → 500 Internal Server Error; full error logged server-side.
 *
 * Stack traces and DB internals are never leaked to the caller.
 * Query parameters are stripped from logged URLs to avoid recording
 * sensitive identifiers (buyerId, storeId) in error logs.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const path = req.url.split("?")[0];
  const reqContext = { method: req.method, url: path };

  // 1. AppError — intentional, structured errors
  if (err instanceof AppError) {
    if (err.status >= 500) {
      logger.error({ err, req: reqContext }, "Application error");
    }
    res.status(err.status).json({
      error: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
    return;
  }

  // 2. Database constraint violations → safe client message
  const dbError = classifyDbError(err);
  if (dbError) {
    logger.warn({ req: reqContext, code: dbError.code }, "Database constraint violation");
    res.status(dbError.status).json({ error: dbError.message, code: dbError.code });
    return;
  }

  // 3. Express-style { status, message } objects
  const status =
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as Record<string, unknown>).status === "number"
      ? ((err as Record<string, unknown>).status as number)
      : 500;

  const clientMessage =
    status < 500 &&
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as Record<string, unknown>).message === "string"
      ? ((err as Record<string, unknown>).message as string)
      : "Internal Server Error";

  // 4. Unexpected errors — always log with full context
  logger.error({ err, req: reqContext }, "Unhandled error");
  res.status(status).json({ error: clientMessage });
}
