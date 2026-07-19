/**
 * Environment validation — throws on startup if required variables are absent.
 * Import this module early in index.ts so misconfiguration is caught before
 * any connections or route handlers are registered.
 */

function require(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `Required environment variable "${key}" is not set. ` +
        `Set it in your .env file or Replit Secrets.`,
    );
  }
  return value.trim();
}

function optional(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim() !== "" ? value.trim() : fallback;
}

export const env = {
  NODE_ENV: optional("NODE_ENV", "development"),
  PORT: require("PORT"),
  JWT_SECRET: require("JWT_SECRET"),
  JWT_REFRESH_SECRET: require("JWT_REFRESH_SECRET"),
  /** Access token TTL — default 15 minutes */
  JWT_ACCESS_EXPIRES_IN: optional("JWT_ACCESS_EXPIRES_IN", "15m"),
  /** Refresh token TTL — default 30 days */
  JWT_REFRESH_EXPIRES_IN: optional("JWT_REFRESH_EXPIRES_IN", "30d"),
  /** Refresh token TTL in milliseconds (derived) */
  get REFRESH_TOKEN_TTL_MS(): number {
    return parseDurationMs(this.JWT_REFRESH_EXPIRES_IN);
  },
} as const;

/**
 * Parse a simple duration string (e.g. "15m", "7d", "2h") to milliseconds.
 * Supports s / m / h / d suffixes.
 */
function parseDurationMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) throw new Error(`Invalid duration format: "${duration}"`);
  const value = parseInt(match[1]!, 10);
  const unit = match[2]!;
  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return value * multipliers[unit]!;
}
