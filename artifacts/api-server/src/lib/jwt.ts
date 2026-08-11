import jwt from "jsonwebtoken";
import { env } from "./env";
import type { UserRole } from "@workspace/db/schema";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  storeId?: string;
  sessionId: string;
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  tokenId: string;
}

const USER_ROLES: readonly UserRole[] = ["buyer", "merchant", "admin"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid JWT claim: ${field}`);
  }
  return value;
}

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

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    issuer: "mobhub",
    audience: "mobhub-api",
  });
  if (!isRecord(decoded)) throw new Error("Invalid access token payload");

  const sub = requireString(decoded.sub, "sub");
  const email = requireString(decoded.email, "email");
  const sessionId = requireString(decoded.sessionId, "sessionId");
  if (!USER_ROLES.includes(decoded.role as UserRole)) throw new Error("Invalid JWT claim: role");
  if (decoded.storeId !== undefined && typeof decoded.storeId !== "string") {
    throw new Error("Invalid JWT claim: storeId");
  }

  return {
    sub,
    email,
    role: decoded.role as UserRole,
    sessionId,
    ...(typeof decoded.storeId === "string" ? { storeId: decoded.storeId } : {}),
  };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: "mobhub",
    audience: "mobhub-refresh",
  });
  if (!isRecord(decoded)) throw new Error("Invalid refresh token payload");

  return {
    sub: requireString(decoded.sub, "sub"),
    sessionId: requireString(decoded.sessionId, "sessionId"),
    tokenId: requireString(decoded.tokenId, "tokenId"),
  };
}

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== "bearer") return null;
  return parts[1] ?? null;
}
