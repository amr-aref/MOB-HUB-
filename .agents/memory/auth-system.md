---
name: Auth System Architecture
description: JWT auth implementation details, token design, known bugs fixed, and mobile integration patterns.
---

## Token design mismatch (FIXED)

`_issueTokensForSession` generates `rawRefresh = generateToken(40)` (random hex), stores `hashToken(rawRefresh)` in DB, but issues a **JWT** as the refresh token. The JWT payload contains `tokenId` (the DB row PK), NOT `rawRefresh`. So lookup must use `payload.tokenId`, not `hashToken(jwt)`.

**Rule:** In `refreshTokens()`, look up the stored token by `eq(refreshTokensTable.id, payload.tokenId)`. The hash column is defence-in-depth only.

**Why:** The code mixed two token models: opaque-hex-hash model and JWT-with-embedded-ID model. The JWT approach won — it's already the transport.

## Secrets

`JWT_SECRET` and `JWT_REFRESH_SECRET` are in Replit secrets. `lib/env.ts` validates both on startup and throws with a clear message if missing — the server won't start without them.

## Database tables pushed

Seven new tables in the auth schema: `users`, `sessions`, `refresh_tokens`, `user_devices`, `audit_logs`, `auth_events`, `verification_tokens`. Run `pnpm --filter @workspace/db run push` after any schema changes.

## lib/db dist must be built

`artifacts/api-server` references `@workspace/db` as a TypeScript composite project reference. The `lib/db/dist/` directory is built by `pnpm --filter @workspace/db exec tsc -p tsconfig.json`. Without it, `tsc --noEmit` fails with TS6305 errors (not TS compilation errors — just missing declarations).

## Mobile AuthContext

`artifacts/mobile/contexts/AuthContext.tsx` — `AuthProvider` wraps the root layout. Uses `expo-secure-store` for token persistence. Calls `setAuthTokenGetter` once on mount so all API client requests automatically attach the bearer token.

## OpenAPI format: email → Zod v3 issue

Orval v8 generates `zod.email()` (Zod v4 API) for `format: email` fields. The project uses Zod v3. **Do not use `format: email` in openapi.yaml** — use plain `type: string` for email fields and validate at the route level with hand-written zod.

## api-client-react index.ts duplicate exports

After codegen, `lib/api-client-react/src/index.ts` accumulated duplicate export lines (different quote styles). Each orval clean+regenerate can leave the file in a broken state. Keep the file to exactly 4 lines (see current state). Metro will fail to resolve if there are duplicates.
