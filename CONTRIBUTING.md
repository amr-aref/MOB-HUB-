# Contributing to MOB HUB

Thank you for your interest in contributing! This document explains how to get started.

---

## Code of Conduct

By participating in this project, you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## Development Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd mob-hub

# 2. Install dependencies (pnpm required — see README)
pnpm install

# 3. Push the database schema
pnpm --filter @workspace/db run push

# 4. Seed sample data
pnpm --filter @workspace/db run seed

# 5. Start the API server
pnpm --filter @workspace/api-server run dev

# 6. Start the mobile app
pnpm --filter @workspace/mobile run dev
```

---

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code. Protected; only merged via PR |
| `develop` | Integration branch for completed features |
| `feature/<name>` | Individual feature work |
| `fix/<name>` | Bug fixes |
| `chore/<name>` | Infrastructure, tooling, dependency updates |

**Never commit directly to `main`.** All changes go through a Pull Request.

---

## Pull Request Process

1. Branch off `develop` using `feature/`, `fix/`, or `chore/` prefix.
2. Keep PRs focused — one feature or fix per PR.
3. Ensure all CI checks pass before requesting review:
   - `pnpm run typecheck` — zero TypeScript errors
   - `pnpm run lint` — zero ESLint errors (warnings are OK)
   - `pnpm --filter @workspace/api-server run build` — clean build
4. Fill out the [PR template](./.github/PULL_REQUEST_TEMPLATE.md) completely.
5. Request review from at least one team member.
6. Squash-merge into `develop`; linear history into `main`.

---

## Versioning

This project uses [Semantic Versioning](https://semver.org/):

- **PATCH** (1.0.x) — bug fixes, dependency patches, tooling
- **MINOR** (1.x.0) — new features, backwards-compatible API changes
- **MAJOR** (x.0.0) — breaking API changes, major architecture shifts

---

## Code Style

- **Formatter**: Prettier (run `pnpm lint:fix` or configure your editor with the `.prettierrc`)
- **Linter**: ESLint (see `eslint.config.mjs`)
- **TypeScript**: Strict mode; avoid `any` — use specific types or `unknown`
- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`

---

## API Changes

If you modify `lib/api-spec/openapi.yaml`, regenerate the client:

```bash
pnpm --filter @workspace/api-spec run codegen
```

Then verify the TypeScript build still passes.

---

## Reporting Bugs

Use the [Bug Report issue template](./.github/ISSUE_TEMPLATE/bug_report.md).

## Requesting Features

Use the [Feature Request issue template](./.github/ISSUE_TEMPLATE/feature_request.md).

## Security Issues

**Do not open a public issue for security vulnerabilities.** See [SECURITY.md](./SECURITY.md).
