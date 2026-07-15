## Summary

<!-- What does this PR do? One sentence. -->

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 🔧 Chore (tooling, dependencies, CI, documentation)
- [ ] ♻️ Refactor (code change that neither fixes a bug nor adds a feature)

## Changes Made

<!-- Bullet-point list of what changed and why -->
-
-

## Testing

<!-- How did you verify this works? -->
- [ ] I ran `pnpm run typecheck` — no errors
- [ ] I ran `pnpm run lint` — no errors
- [ ] I manually tested the affected screens/routes

## Screenshots / Demo

<!-- If UI changes, add before/after screenshots. For API changes, show curl/Postman output. Delete if not applicable. -->

## Checklist

- [ ] PR title follows Conventional Commits format (`feat:`, `fix:`, `chore:`, etc.)
- [ ] Branch is up-to-date with `develop`
- [ ] No secrets or credentials in code
- [ ] API spec updated if routes changed (`lib/api-spec/openapi.yaml`)
- [ ] Codegen run if OpenAPI spec changed (`pnpm --filter @workspace/api-spec run codegen`)
- [ ] No new `any` types introduced without justification
