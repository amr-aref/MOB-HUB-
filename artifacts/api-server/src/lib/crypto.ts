import bcrypt from "bcryptjs";
import { createHash, timingSafeEqual } from "crypto";
import { randomBytes } from "crypto";

// ─── Password hashing ─────────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Timing-safe password comparison via bcrypt.
 * bcrypt.compare is inherently timing-safe for the hash comparison phase.
 */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ─── Token helpers ────────────────────────────────────────────────────────────

/** Generate a cryptographically random URL-safe token of the given byte length. */
export function generateToken(byteLength = 32): string {
  return randomBytes(byteLength).toString("hex");
}

/** SHA-256 hex digest of a token — used for DB storage. */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Timing-safe comparison of two hex-encoded hash strings.
 * Prevents timing attacks on token lookups.
 */
export function safeCompareHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}
