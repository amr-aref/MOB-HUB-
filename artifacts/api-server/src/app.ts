import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { errorHandler } from "./middlewares/errorHandler";
import { generalLimiter, writeLimiter, authLimiter } from "./middlewares/rateLimiter";
import { correlationId } from "./middlewares/correlationId";

const app: Express = express();

// ─── Reverse-proxy trust ──────────────────────────────────────────────────────
// Replit routes traffic through a load-balancer that sets X-Forwarded-For.
// Without this, express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// on every request and falls back to an inaccurate IP key.
// A hop count of 1 trusts only the immediately adjacent proxy (the Replit
// load-balancer) — not arbitrary XFF chains supplied by untrusted clients.
app.set("trust proxy", 1);

// ─── Correlation ID ───────────────────────────────────────────────────────────
// Must be first so every subsequent middleware and route handler can read
// req.correlationId and the response header is always present.
app.use(correlationId);

// ─── Security headers (Helmet) ────────────────────────────────────────────────
// Sets X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS,
// Referrer-Policy, and removes X-Powered-By.
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────────────────────
// In development/Replit: allow all origins (mobile app has no CORS restriction).
// In production: set CORS_ORIGIN env var to a comma-separated list of allowed origins.
const rawOrigin = process.env.CORS_ORIGIN;
const corsOrigin: string | string[] | boolean = rawOrigin
  ? rawOrigin.split(",").map((s) => s.trim())
  : true;

app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization", "X-Correlation-ID"],
    exposedHeaders: ["X-Correlation-ID"],
    credentials: false,
    maxAge: 86400,
  }),
);

// ─── Request logging ──────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req as typeof req & { correlationId?: string }).correlationId ?? req.id,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ─── Body parsers (with size limits) ─────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ─── Response compression ─────────────────────────────────────────────────────
app.use(compression());

// ─── Rate limiting ────────────────────────────────────────────────────────────
// Auth-specific limiter — tighter window for brute-force mitigation.
app.use(
  "/api/auth",
  (req, res, next) => {
    if (
      [
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
      ].includes(req.path === req.url ? req.path : req.url.split("?")[0]!)
    ) {
      return authLimiter(req, res, next);
    }
    return next();
  },
);

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
app.use(errorHandler);

export default app;
