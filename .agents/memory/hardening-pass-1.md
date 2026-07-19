---
name: Hardening Pass 1 — Safety, Security, Cleanup
description: Changes made in the first enterprise hardening pass. What was fixed, what was left, and what to watch for.
---

## What was done (Hardening Pass 1 — July 2026)

### Security
- **H1 IDOR fixed**: `artifacts/api-server/src/routes/notifications.ts` — all three single-resource endpoints (GET /:id, PATCH /:id/read, DELETE /:id) now require `userId` as a query param and return 403 if it doesn't match `notification.userId`. Server fetches the row first, checks ownership, then acts.
- OpenAPI spec updated (`lib/api-spec/openapi.yaml`) to add `userId` as required query param on those three operations. API client regenerated via `pnpm --filter @workspace/api-spec run codegen`.
- `artifacts/mobile/hooks/useNotifications.ts` updated: `markRead` and `remove` now pass `{ id, params: { userId } }` to match new generated mutation signatures.

### Infrastructure
- **Trust proxy**: `artifacts/api-server/src/app.ts` — added `app.set("trust proxy", 1)`. Without this, `express-rate-limit` threw `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` on every request (Replit runs behind a load-balancer that injects X-Forwarded-For). Rate limiting now works correctly.
- **Compression**: Added `compression` middleware (gzip/deflate) to `app.ts` after body parsers. Installed `compression` + `@types/compression` in `artifacts/api-server/package.json`.
- **DB pool config**: `lib/db/src/index.ts` — pool now has `max: 10`, `idleTimeoutMillis: 30_000`, `connectionTimeoutMillis: 5_000`. Previously bare `connectionString` only.

### Dependency cleanup
- Removed `cookie-parser` + `@types/cookie-parser` from `artifacts/api-server/package.json` (was installed, never imported).
- Removed `@replit/connectors-sdk` from root `package.json` (never used).

### Lint / code health (103 → 87 warnings, −16)
- `artifacts/mobile/components/admin/AdminComponents.tsx`: removed unused `useState`, `withSequence`, `Ionicons`, `colors` imports; added missing `progress`, `delay`, `heightProgress` to two `useEffect` deps arrays.
- `artifacts/mobile/components/admin/AnimatedCounter.tsx`: removed unused `Animated` (default), `useAnimatedProps`, `runOnJS` imports and the unused `AnimatedText` creation; added missing `progress` to `useEffect` deps.
- `artifacts/mobile/app/store/[id].tsx`: removed unused `useAnimatedStyle`, `useSharedValue`, `withSpring` from Reanimated import; removed unused `latinReg` variable.
- `artifacts/mobile/components/ProductCard.tsx`: removed unused `Platform` import.
- `artifacts/mobile/components/ReviewFormModal.tsx`: added missing `language` and `slideAnim` to `useEffect` deps.

### Codegen side-effect
- Orval codegen appended duplicate exports to `lib/api-client-react/src/index.ts`. Fixed by rewriting the file to canonical 4-line form.
- Codegen runs changed the generated hook types (queryKey now required in options). These 14 pre-existing TypeCheck errors were confirmed to pre-date this session; count unchanged.

## What was NOT done (still open)

- **C1 Auth**: No auth system — device UUID in AsyncStorage. Requires full auth sprint (feature scope).
- **C2 Tests**: No test infrastructure set up. Phase 11 work remains.
- **H2 SecureStore**: DeviceId still in plain AsyncStorage. Requires `expo-secure-store` install + hook rewrite.
- **H3 CI/CD**: No pipeline. Requires GitHub Actions or Replit deploy hooks.
- **H4 Monitoring**: Only stdout Pino logs. Requires Sentry/Datadog integration.
- **M2 CORS**: Still `corsOrigin = true` when `CORS_ORIGIN` env var unset (dev default). Add a startup warning.
- **M5 Screen refactor**: `store/[id].tsx` is still 1835 lines.
- **M6 Null assertions**: Non-null `!` on API data in `store/[id].tsx:331,334` and `reservations/[id].tsx:294`.
- **M7 HTTP caching**: No `Cache-Control` headers on read endpoints.
- **87 lint warnings**: Mostly `any` types in store/[id].tsx, `actionTypes` in mockup-sandbox use-toast.ts.

## Key technical notes
- Orval v8.20.0 generates `UseQueryOptions` (not `Partial<>`), making `queryKey` required in `options.query`. Existing call sites (13 files) pass `{ enabled, staleTime }` without `queryKey` → 14 pre-existing TS errors. Not introduced by this session.
- `compression()` middleware currently not confirmed gzip (responses may be under the default 1 KB threshold). For larger payloads (product lists, notifications) it will activate.
- The "Mobile App" workflow (manually configured, port 18115) always fails with EADDRINUSE because the `artifacts/mobile: expo` workflow already holds that port. This is expected — use `artifacts/mobile: expo` as the canonical workflow.
