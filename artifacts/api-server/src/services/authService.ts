import { randomUUID } from "crypto";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  usersTable,
  sessionsTable,
  refreshTokensTable,
  userDevicesTable,
  verificationTokensTable,
} from "@workspace/db/schema";
import type { UserRole } from "@workspace/db/schema";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  hashToken,
} from "../lib/crypto";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";
import { env } from "../lib/env";
import { AppError } from "../lib/api-helpers";
import { logger } from "../lib/logger";

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  nameAr?: string;
  role?: UserRole;
  storeId?: string;
  deviceId?: string;
  platform?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  deviceId?: string;
  platform?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // access token TTL in seconds
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateUserId(): string {
  return `usr_${randomUUID()}`;
}

function generateSessionId(): string {
  return `ses_${randomUUID()}`;
}

function generateTokenId(): string {
  return `rtk_${randomUUID()}`;
}

function generateDeviceId(): string {
  return `dev_${randomUUID()}`;
}

function generateVerificationId(): string {
  return `vtk_${randomUUID()}`;
}

/** Parse "15m" / "30d" to seconds for the access token expiresIn field. */
function durationToSeconds(d: string): number {
  const m = /^(\d+)([smhd])$/.exec(d);
  if (!m) return 900;
  const n = parseInt(m[1]!, 10);
  const factors: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return n * (factors[m[2]!] ?? 60);
}

// ─── Core auth operations ─────────────────────────────────────────────────────

/** Register a new user. Returns the issued token pair. */
export async function register(
  input: RegisterInput,
  ipAddress?: string,
  userAgent?: string,
): Promise<{ user: typeof usersTable.$inferSelect; tokens: TokenPair }> {
  const email = input.email.toLowerCase().trim();

  // Duplicate-email check
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email));
  if (existing) {
    throw new AppError(409, "An account with this email already exists", "EMAIL_TAKEN");
  }

  const passwordHash = await hashPassword(input.password);
  const userId = generateUserId();
  const now = new Date();

  const [user] = await db
    .insert(usersTable)
    .values({
      id: userId,
      email,
      passwordHash,
      name: input.name.trim(),
      nameAr: input.nameAr?.trim() || input.name.trim(),
      role: input.role ?? "buyer",
      storeId: input.storeId ?? null,
    })
    .returning();

  if (!user) throw AppError.internal("Failed to create user");

  // Register device if provided
  if (input.deviceId) {
    await db.insert(userDevicesTable).values({
      id: generateDeviceId(),
      userId,
      deviceId: input.deviceId,
      platform: input.platform ?? null,
    });
  }

  const tokens = await _issueTokenPair(user, input.deviceId, ipAddress, userAgent);

  return { user, tokens };
}

/** Login with email + password. Returns the issued token pair. */
export async function login(
  input: LoginInput,
  ipAddress?: string,
  userAgent?: string,
): Promise<{ user: typeof usersTable.$inferSelect; tokens: TokenPair }> {
  const email = input.email.toLowerCase().trim();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  // Use constant-time password check even when user not found
  const candidateHash = user?.passwordHash ?? "$2a$12$invalidhashpadding00000000000000000000000000000000000000";
  const passwordOk = await verifyPassword(input.password, candidateHash);

  if (!user || !passwordOk) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  if (!user.isActive) {
    throw new AppError(403, "Account is suspended", "ACCOUNT_SUSPENDED");
  }

  // Upsert device registration
  if (input.deviceId) {
    const [knownDevice] = await db
      .select({ id: userDevicesTable.id })
      .from(userDevicesTable)
      .where(
        and(
          eq(userDevicesTable.userId, user.id),
          eq(userDevicesTable.deviceId, input.deviceId),
        ),
      );

    if (knownDevice) {
      await db
        .update(userDevicesTable)
        .set({ lastSeenAt: new Date() })
        .where(eq(userDevicesTable.id, knownDevice.id));
    } else {
      await db.insert(userDevicesTable).values({
        id: generateDeviceId(),
        userId: user.id,
        deviceId: input.deviceId,
        platform: input.platform ?? null,
      });
    }
  }

  const tokens = await _issueTokenPair(user, input.deviceId, ipAddress, userAgent);

  return { user, tokens };
}

/**
 * Rotate refresh tokens.
 * Revokes the used token and issues a fresh access + refresh pair.
 * Detects reuse attacks: if the token is already revoked, revoke the entire
 * session (all refresh tokens) as a security measure.
 */
export async function refreshTokens(rawRefreshToken: string): Promise<TokenPair> {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token", "INVALID_TOKEN");
  }

  const tokenHash = hashToken(rawRefreshToken);

  const [storedToken] = await db
    .select()
    .from(refreshTokensTable)
    .where(eq(refreshTokensTable.tokenHash, tokenHash));

  if (!storedToken) {
    throw new AppError(401, "Refresh token not found", "INVALID_TOKEN");
  }

  // Reuse detection — if already revoked, invalidate the entire session
  if (storedToken.revokedAt !== null) {
    logger.warn(
      { userId: storedToken.userId, sessionId: storedToken.sessionId },
      "Refresh token reuse detected — revoking session",
    );
    await _revokeSession(storedToken.sessionId);
    throw new AppError(401, "Token reuse detected. Please log in again.", "TOKEN_REUSE");
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AppError(401, "Refresh token expired", "TOKEN_EXPIRED");
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, storedToken.userId));

  if (!user || !user.isActive) {
    throw new AppError(401, "Account unavailable", "ACCOUNT_UNAVAILABLE");
  }

  // Revoke the used token
  await db
    .update(refreshTokensTable)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokensTable.id, storedToken.id));

  // Issue new token pair on the same session
  return _issueTokensForSession(user, storedToken.sessionId);
}

/** Logout: revoke the session and all its refresh tokens. */
export async function logout(sessionId: string): Promise<void> {
  await _revokeSession(sessionId);
}

/** Logout from all devices: revoke all sessions for the user. */
export async function logoutAll(userId: string): Promise<void> {
  const sessions = await db
    .select({ id: sessionsTable.id })
    .from(sessionsTable)
    .where(eq(sessionsTable.userId, userId));

  for (const session of sessions) {
    await _revokeSession(session.id);
  }
}

/** Request a password reset token. Returns the raw token (caller sends via email). */
export async function requestPasswordReset(email: string): Promise<string | null> {
  const normalised = email.toLowerCase().trim();
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, normalised));

  if (!user) return null; // Don't reveal whether the email exists

  const rawToken = generateToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Invalidate any prior pending reset tokens
  await db
    .update(verificationTokensTable)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(verificationTokensTable.userId, user.id),
        eq(verificationTokensTable.type, "password_reset"),
        isNull(verificationTokensTable.usedAt),
      ),
    );

  await db.insert(verificationTokensTable).values({
    id: generateVerificationId(),
    userId: user.id,
    tokenHash,
    type: "password_reset",
    expiresAt,
  });

  return rawToken;
}

/** Consume a password reset token and update the password. */
export async function resetPassword(
  rawToken: string,
  newPassword: string,
): Promise<void> {
  const tokenHash = hashToken(rawToken);

  const [record] = await db
    .select()
    .from(verificationTokensTable)
    .where(
      and(
        eq(verificationTokensTable.tokenHash, tokenHash),
        eq(verificationTokensTable.type, "password_reset"),
        isNull(verificationTokensTable.usedAt),
      ),
    );

  if (!record || record.expiresAt < new Date()) {
    throw new AppError(400, "Invalid or expired reset token", "INVALID_TOKEN");
  }

  const passwordHash = await hashPassword(newPassword);

  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(usersTable.id, record.userId));

    await tx
      .update(verificationTokensTable)
      .set({ usedAt: new Date() })
      .where(eq(verificationTokensTable.id, record.id));
  });

  // Force logout all sessions after password change
  await logoutAll(record.userId);
}

/** Generate and store an email verification token. Returns the raw token. */
export async function createEmailVerificationToken(userId: string): Promise<string> {
  const rawToken = generateToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db
    .update(verificationTokensTable)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(verificationTokensTable.userId, userId),
        eq(verificationTokensTable.type, "email_verify"),
        isNull(verificationTokensTable.usedAt),
      ),
    );

  await db.insert(verificationTokensTable).values({
    id: generateVerificationId(),
    userId,
    tokenHash,
    type: "email_verify",
    expiresAt,
  });

  return rawToken;
}

/** Consume an email verification token and mark the account as verified. */
export async function verifyEmail(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);

  const [record] = await db
    .select()
    .from(verificationTokensTable)
    .where(
      and(
        eq(verificationTokensTable.tokenHash, tokenHash),
        eq(verificationTokensTable.type, "email_verify"),
        isNull(verificationTokensTable.usedAt),
      ),
    );

  if (!record || record.expiresAt < new Date()) {
    throw new AppError(400, "Invalid or expired verification token", "INVALID_TOKEN");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({ isEmailVerified: true, updatedAt: new Date() })
      .where(eq(usersTable.id, record.userId));

    await tx
      .update(verificationTokensTable)
      .set({ usedAt: new Date() })
      .where(eq(verificationTokensTable.id, record.id));
  });
}

// ─── Private helpers ──────────────────────────────────────────────────────────

async function _issueTokenPair(
  user: typeof usersTable.$inferSelect,
  deviceId?: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<TokenPair> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_MS);

  await db.insert(sessionsTable).values({
    id: sessionId,
    userId: user.id,
    deviceId: deviceId ?? null,
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
    expiresAt,
  });

  return _issueTokensForSession(user, sessionId);
}

async function _issueTokensForSession(
  user: typeof usersTable.$inferSelect,
  sessionId: string,
): Promise<TokenPair> {
  const tokenId = generateTokenId();
  const rawRefresh = generateToken(40);
  const tokenHash = hashToken(rawRefresh);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_MS);

  await db.insert(refreshTokensTable).values({
    id: tokenId,
    tokenHash,
    userId: user.id,
    sessionId,
    expiresAt,
  });

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    ...(user.storeId ? { storeId: user.storeId } : {}),
    sessionId,
  });

  const refreshToken = signRefreshToken({ sub: user.id, sessionId, tokenId });

  return {
    accessToken,
    refreshToken,
    expiresIn: durationToSeconds(env.JWT_ACCESS_EXPIRES_IN),
  };
}

async function _revokeSession(sessionId: string): Promise<void> {
  const now = new Date();

  await db
    .update(refreshTokensTable)
    .set({ revokedAt: now })
    .where(
      and(
        eq(refreshTokensTable.sessionId, sessionId),
        isNull(refreshTokensTable.revokedAt),
      ),
    );

  await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
}
