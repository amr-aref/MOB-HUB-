/**
 * Shared API utilities — pagination parsing, structured errors, response helpers.
 * Centralises patterns that were previously duplicated across route files.
 */

import type { Request, Response } from "express";

// ─── Structured Application Error ─────────────────────────────────────────────

/**
 * Intentional application error with an HTTP status code and an optional
 * machine-readable code. Throwing or passing this to `next()` causes the
 * global error handler to return a structured JSON response without logging
 * a full stack trace for expected conditions (4xx).
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }

  static badRequest(message: string, code = "BAD_REQUEST"): AppError {
    return new AppError(400, message, code);
  }

  static notFound(entity: string): AppError {
    return new AppError(404, `${entity} not found`, "NOT_FOUND");
  }

  static forbidden(message = "Access denied"): AppError {
    return new AppError(403, message, "FORBIDDEN");
  }

  static conflict(message: string, code = "CONFLICT"): AppError {
    return new AppError(409, message, code);
  }

  static internal(message = "Internal Server Error"): AppError {
    return new AppError(500, message, "INTERNAL_ERROR");
  }
}

// ─── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationResult {
  limit: number;
  offset: number;
}

/**
 * Parse and validate `limit` / `offset` query parameters.
 * Throws `AppError.badRequest` on invalid input so Express 5 propagates it
 * automatically without try/catch in the caller.
 */
export function parsePagination(
  query: Request["query"],
  options: { defaultLimit?: number; maxLimit?: number } = {},
): PaginationResult {
  const { defaultLimit = 50, maxLimit = 200 } = options;

  let limit = defaultLimit;
  let offset = 0;

  if (query["limit"] !== undefined) {
    const parsed = Number(query["limit"]);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw AppError.badRequest("limit must be a positive integer");
    }
    limit = Math.min(parsed, maxLimit);
  }

  if (query["offset"] !== undefined) {
    const parsed = Number(query["offset"]);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw AppError.badRequest("offset must be a non-negative integer");
    }
    offset = parsed;
  }

  return { limit, offset };
}

// ─── Response helpers ─────────────────────────────────────────────────────────

/** Terminate the current handler with a 404 JSON response. */
export function sendNotFound(res: Response, entity: string): void {
  res.status(404).json({ error: `${entity} not found` });
}

/** Terminate the current handler with a 400 validation-error JSON response. */
export function sendValidationError(res: Response, errors: string[]): void {
  res.status(400).json({ error: "Validation failed", details: errors });
}

// ─── String helpers ────────────────────────────────────────────────────────────

/** Trim and return the string, or throw AppError.badRequest if blank/missing. */
export function requireString(
  value: unknown,
  fieldName: string,
  options: { maxLength?: number } = {},
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw AppError.badRequest(`${fieldName} is required`);
  }
  const trimmed = value.trim();
  if (options.maxLength && trimmed.length > options.maxLength) {
    throw AppError.badRequest(
      `${fieldName} must be at most ${options.maxLength} characters`,
    );
  }
  return trimmed;
}

/** Return the string value or undefined — never throws. */
export function optionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return undefined;
}
