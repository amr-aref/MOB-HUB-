/**
 * Shared API origin resolution for mobile auth + generated client.
 *
 * Priority:
 * 1. EXPO_PUBLIC_API_URL — full origin (e.g. http://localhost:3000 or http://192.168.1.10:3000)
 * 2. EXPO_PUBLIC_DOMAIN — Replit-style host → https://{domain}
 * 3. http://localhost:3000 — matches API PORT in root .env.example
 */
export function getApiBaseUrl(): string {
  const explicit = process.env['EXPO_PUBLIC_API_URL']?.trim();
  if (explicit) {
    return explicit.replace(/\/+$/, '');
  }

  const domain = process.env['EXPO_PUBLIC_DOMAIN']?.trim();
  if (domain) {
    const host = domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    return `https://${host}`;
  }

  return 'http://localhost:3000';
}
