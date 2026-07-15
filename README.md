# MOB HUB — Egypt Mobile Phone Marketplace

> A full-stack mobile marketplace for buying and comparing phones across Egypt — Arabic-first, RTL-native, built with Expo and Express.

---

## Overview

MOB HUB is a monorepo containing three artifacts:

| Artifact | Stack | Purpose |
|---|---|---|
| `artifacts/mobile` | Expo 54 / React Native 0.81 | Consumer-facing iOS/Android/Web app |
| `artifacts/api-server` | Express 5 / Drizzle ORM / PostgreSQL | REST API backend |
| `artifacts/mockup-sandbox` | React 19 / Vite 7 / Tailwind 4 | Design component sandbox |

Supporting libraries in `lib/`:

| Package | Purpose |
|---|---|
| `@workspace/db` | Drizzle schema, migrations, seed |
| `@workspace/api-spec` | OpenAPI 3.1 spec + Orval codegen config |
| `@workspace/api-client-react` | Generated React Query hooks |
| `@workspace/api-zod` | Generated Zod schemas |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v10+
- A PostgreSQL database (Replit provisions this automatically)

---

## Getting Started

```bash
# Install all workspace dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Seed with sample data
pnpm --filter @workspace/db run seed

# Start the API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Start the mobile app (Expo)
pnpm --filter @workspace/mobile run dev
```

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm run typecheck` | TypeScript check across all packages |
| `pnpm run lint` | ESLint across all packages |
| `pnpm run lint:fix` | ESLint with auto-fix |
| `pnpm run build` | Typecheck + build all packages |
| `pnpm --filter @workspace/db run push` | Push schema changes to dev database |
| `pnpm --filter @workspace/db run seed` | Seed the database with sample data |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API client from OpenAPI spec |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (auto-provisioned on Replit) |
| `PORT` | ✅ | API server listen port (set by Replit runtime) |
| `NODE_ENV` | — | `development` or `production` (affects logging format) |
| `LOG_LEVEL` | — | Pino log level, defaults to `info` |
| `CORS_ORIGIN` | — | Comma-separated allowed CORS origins; defaults to permissive in dev |

---

## Architecture

```
workspace/
├── artifacts/
│   ├── api-server/        # Express API (PORT=8080, path=/api)
│   ├── mobile/            # Expo app (Expo Go / web)
│   └── mockup-sandbox/    # Vite design sandbox (PORT=8081, path=/__mockup)
├── lib/
│   ├── db/                # Drizzle schema + migrations
│   ├── api-spec/          # OpenAPI spec + Orval config
│   ├── api-client-react/  # Generated React Query hooks
│   └── api-zod/           # Generated Zod validators
└── scripts/               # Utility scripts
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

See [SECURITY.md](./SECURITY.md) for responsible disclosure.

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## License

MIT — see [LICENSE](./LICENSE).
