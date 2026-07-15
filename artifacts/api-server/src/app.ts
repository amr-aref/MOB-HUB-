import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { errorHandler } from "./middlewares/errorHandler";
import { generalLimiter, writeLimiter } from "./middlewares/rateLimiter";

const app: Express = express();

// ─── Security headers (Helmet) ────────────────────────────────────────────────
// Sets X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS,
// Referrer-Policy, and removes X-Powered-By. Must be the first middleware.
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────────────────────
// In development/Replit: allow all origins (mobile app has no CORS restriction).
// In production: set CORS_ORIGIN env var to a comma-separated list of allowed origins.
const rawOrigin = process.env.CORS_ORIGIN;
const corsOrigin: string | string[] | boolean = rawOrigin
  ? rawOrigin.split(",").map((s) => s.trim())
  : true; // allow all — safe default for a mobile-first API

app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
    // Credentials are not used; keeping this false avoids wildcard+credentials conflicts.
    credentials: false,
    maxAge: 86400, // preflight cache: 24 hours
  }),
);

// ─── Request logging ──────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// ─── Body parsers (with size limits) ─────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ─── Rate limiting ────────────────────────────────────────────────────────────
// General limiter on all API routes.
app.use("/api", generalLimiter);

// Stricter limiter on state-mutating methods.
app.use("/api", (req, res, next) => {
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    return writeLimiter(req, res, next);
  }
  return next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── Global error handler ────────────────────────────────────────────────────
// Must be registered AFTER all routes. Catches any error passed via next(err)
// or thrown inside an Express 5 async route handler.
app.use(errorHandler);

export default app;
