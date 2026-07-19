import jwt from "jsonwebtoken";
import { env } from "./env";
import type { UserRole } from "@workspace/db/schema";

// ─── Token payloads ───────────────────────────────────────────────────────────

export interface AccessTokenPayload {
  sub: string;        // userId
  email: string;
  role: UserRole;
  storeId?: string;   // present when role === "merchant"
  sessionId: string;
}

export interface RefreshTokenPayload {
  sub: string;        // userId
  sessionId: string;
  tokenId: string;    // refreshTokens.id — used for rotation
}

// ─── Token generation ─────────────────────────────────────────────────────────

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    issuer: "mobhub",
    audience: "mobhub-api",
  });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    issuer: "mobhub",
    audience: "mobhub-refresh",
  });
}

// ─── Token verification ───────────────────────────────────────────────────────

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    issuer: "mobhub",
    audience: "mobhub-api",
  });
  return decoded as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: "mobhub",
    audience: "mobhub-refresh",
  });
  return decoded as RefreshTokenPayload;
}

/** Extract the raw token string from an Authorization: Bearer <token> header. */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== "bearer") return null;
  return parts[1] ?? null;
}
