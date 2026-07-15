---
name: api-zod index export collision
description: Why api-zod/src/index.ts must only export from generated/api, not generated/types
---

## Rule
`lib/api-zod/src/index.ts` must only contain:
```typescript
export * from "./generated/api";
```
Do NOT add `export * from "./generated/types"`.

**Why:** Orval v8 split mode generates TypeScript interfaces in `generated/types/` AND zod schemas with the same names in `generated/api.ts`. Re-exporting from both causes TS2308 ambiguity errors. This surfaces whenever a new endpoint has query params or body schemas (e.g. `DeleteReviewParams`, `UpdateReviewBody`).

**How to apply:** After every `pnpm --filter @workspace/api-spec run codegen` run, verify `lib/api-zod/src/index.ts` has only one export line. Same applies to `lib/api-client-react/src/index.ts` which also had duplicate exports — keep it at 4 lines (api, api.schemas, setBaseUrl/setAuthTokenGetter, AuthTokenGetter).
