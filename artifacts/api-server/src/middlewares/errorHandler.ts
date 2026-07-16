import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

/**
 * Global Express error-handling middleware.
 *
 * Catches any error passed via next(err) or thrown inside an async route
 * (Express 5 automatically wraps async handlers). Logs the full error
 * server-side via Pino and returns a sanitised JSON response to the client
 * — stack traces and internal details are never leaked to the caller.
 * Query parameters are stripped from the logged URL to avoid recording
 * sensitive identifiers (buyerId, storeId) in error logs.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const status =
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as Record<string, unknown>).status === "number"
      ? ((err as Record<string, unknown>).status as number)
      : 500;

  const message =
    status < 500 &&
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as Record<string, unknown>).message === "string"
      ? ((err as Record<string, unknown>).message as string)
      : "Internal Server Error";

  // Strip query string from URL to avoid logging buyerId / storeId etc.
  const path = req.url.split("?")[0];
  logger.error({ err, req: { method: req.method, url: path } }, "Unhandled error");

  res.status(status).json({ error: message });
}
