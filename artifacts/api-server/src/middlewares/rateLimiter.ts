import rateLimit from "express-rate-limit";

/**
 * General rate limiter: applied to all API routes.
 * 200 requests per 15 minutes per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skipSuccessfulRequests: false,
});

/**
 * Write limiter: applied to state-mutating endpoints (POST, PUT, DELETE).
 * Prevents spam submissions and brute-force write attempts.
 * 30 requests per 15 minutes per IP.
 */
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many write requests, please try again later." },
});

/**
 * Auth limiter: applied exclusively to authentication endpoints.
 * 10 attempts per 15 minutes per IP — mitigates brute-force / credential stuffing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later." },
  skipSuccessfulRequests: false,
});
