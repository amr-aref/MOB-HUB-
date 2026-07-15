# MOB HUB — Egypt Mobile Phone Marketplace

An Expo mobile marketplace app (Arabic RTL) for buying/comparing phones in Egypt, backed by a shared Express API server. Re-imported from GitHub on 2026-07-15; artifacts and workflows were re-registered cleanly by the platform this time (API Server, Mobile Marketplace, Canvas/mockup-sandbox).

## Run & Operate

- Workflow `artifacts/mobile: expo` — Expo mobile app, reachable at `https://$REPLIT_EXPO_DEV_DOMAIN/`
- Workflow `artifacts/api-server: API Server` — Express API on port 8080, health check at `/api/healthz`
- Workflow `artifacts/mockup-sandbox: Component Preview Server` — Vite design sandbox on port 8081 at `/__mockup`
- DB schema pushed and seeded (`pnpm --filter @workspace/db run push` then `run seed`) as part of initial setup
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run seed` — seed the database with sample data
- Required env: `DATABASE_URL` — runtime-managed by Replit (auto-provisioned, no action needed)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo Router (`artifacts/mobile`)
- API: Express 5 (`artifacts/api-server`)
- Canvas/design tool: `artifacts/mockup-sandbox` (not currently running; start manually if needed for canvas mockup work)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Mobile app screens/components: `artifacts/mobile/app`, `artifacts/mobile/components`
- Mobile design tokens: `artifacts/mobile/constants/colors.ts`
- API routes: `artifacts/api-server/src/routes`
- Shared OpenAPI spec: `lib/api-spec/openapi.yaml`

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

Egypt mobile phone marketplace: browse/compare phones and stores, favorites, and a per-store seller dashboard (add product, orders, messages, reviews).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- On an earlier import, the artifact registry started out empty despite `artifact.toml` files existing on disk, requiring manual workflow setup. On this re-import (2026-07-15), `listArtifacts()`/workflow registration worked cleanly out of the box — no manual workaround was needed.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
