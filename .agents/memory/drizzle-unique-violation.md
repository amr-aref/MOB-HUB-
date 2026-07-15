---
name: Drizzle unique-constraint error structure
description: How to detect a PG 23505 (unique constraint) error thrown by Drizzle ORM — the code lives in `.cause`, not on the top-level error.
---

Drizzle wraps every failed INSERT/UPDATE in a `_DrizzleQueryError`. The original
`pg` error (which carries `code: "23505"`) is attached as the `.cause` property,
not on the Drizzle error itself.

**How to apply:**

```typescript
function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as Record<string, unknown>;
  // Direct PG error (plain pool query)
  if (e.code === "23505") return true;
  // Drizzle wraps PG error in .cause
  if (typeof e.cause === "object" && e.cause !== null &&
      (e.cause as Record<string, unknown>).code === "23505") return true;
  // Fallback: message string
  if (typeof e.message === "string" && e.message.includes("unique constraint")) return true;
  return false;
}
```

**Why:** Discovered when the reservation service's try/catch for INSERT uniqueness
violations was returning 500 instead of 409 — `err.code` was `undefined` because
Drizzle had wrapped the PG error.
