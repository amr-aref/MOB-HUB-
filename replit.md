# MOB HUB — Egypt Mobile Phone Marketplace

An Expo mobile marketplace app (Arabic RTL) for buying/comparing phones in Egypt, backed by a shared Express API server. Imported from GitHub as a published-app snapshot on 2026-07-13.

## Run & Operate

- Workflow `Mobile` — runs the Expo app (`pnpm --filter @workspace/mobile run dev`), reachable at `https://$REPLIT_EXPO_DEV_DOMAIN/`
- Workflow `API Server` — runs the Express API (`pnpm --filter @workspace/api-server run dev`, port 8080), health check at `/api/healthz`
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run seed` — seed the database with sample data (needed once after a fresh DB/import — tables exist but are empty until this runs)
- Required env: `DATABASE_URL` — Postgres connection string (already provisioned)

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

- This repo was imported as a single "Published your App" git snapshot, so the platform's artifact registry (`listArtifacts()`/managed workflows) started out **empty** even though `artifacts/*/.replit-artifact/artifact.toml` files exist on disk. The `Mobile` and `API Server` workflows here were configured manually (`configureWorkflow`) with `PORT`/`BASE_PATH` set inline to match the artifact.toml values, since `createArtifact` refuses to recreate an existing directory. Path-based multi-artifact proxy routing (e.g. serving `api-server` under `/api` or `mockup-sandbox` under `/__mockup` on the same domain) is NOT active — only the Expo domain (mobile) and directly-curled ports work. If proper artifact registration/routing is ever needed, it likely requires a fresh `createArtifact` after removing the existing directories, or platform-side support.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
