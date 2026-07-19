import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

const HEADER = "x-correlation-id";

/**
 * Attaches a correlation ID to every request.
 * Re-uses the client-supplied header if present; otherwise generates a UUID.
 * The ID is echoed back in the response header so clients can correlate
 * log entries with their own observability pipeline.
 */
export function correlationId(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.headers[HEADER];
  const id =
    typeof incoming === "string" && incoming.trim().length > 0
      ? incoming.trim()
      : randomUUID();

  req.correlationId = id;
  res.setHeader(HEADER, id);
  next();
}
