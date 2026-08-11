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
import { env } from "./lib/env";

const app: Express = express();

// ─── Reverse-proxy trust ──────────────────────────────────────────────────────
app.set("trust proxy", 1);

// ─── Correlation ID ───────────────────────────────────────────────────────────
app.use(correlationId);

// ─── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────────────────────
// Production requires an explicit allow-list. Development remains permissive
// because native Expo clients do not participate in browser CORS.
const corsOrigin: string | string[] | boolean = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
  : env.NODE_ENV !== "production";

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

// ─── Request logging ─────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req as typeof req & { correlationId?: string }).correlationId ?? req.id,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ─── Response compression ────────────────────────────────────────────────────
app.use(compression());

// ─── Rate limiting ───────────────────────────────────────────────────────────
app.use(
  "/api/auth",
  (req, res, next) => {
    const path = req.originalUrl.split("?")[0];
    if (
      [
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
      ].includes(path)
    ) {
      return authLimiter(req, res, next);
    }
    return next();
  },
);

app.use("/api", generalLimiter);

app.use("/api", (req, res, next) => {
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    return writeLimiter(req, res, next);
  }
  return next();
});

app.use("/api", router);
app.use(errorHandler);

export default app;
