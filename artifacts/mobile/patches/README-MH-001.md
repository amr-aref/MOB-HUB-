# MH-001 — Bind merchant dashboard to session `storeId`

## Already complete on this branch
- `artifacts/mobile/app/dashboard/reservations.tsx` (full fix committed)

## Apply full UI fix for index + add-product

From repo root on branch `fix/mh-001-session-storeid`:

```bash
# 1) Restore full UI from main (replaces interim shells)
git checkout main -- \
  artifacts/mobile/app/dashboard/index.tsx \
  artifacts/mobile/app/dashboard/add-product.tsx

# 2) Apply MH-001 patches
git apply artifacts/mobile/patches/mh-001-index.patch
git apply artifacts/mobile/patches/mh-001-add-product.patch

# 3) Verify no hardcoded tenant
grep -n "STORE_ID\|'s1'" artifacts/mobile/app/dashboard/index.tsx \
  artifacts/mobile/app/dashboard/add-product.tsx \
  artifacts/mobile/app/dashboard/reservations.tsx || echo "OK: no hardcoded store"

# 4) Typecheck
pnpm --filter @workspace/mobile exec tsc --noEmit
```

## What the patches enforce
- `useAuth()` → `storeId` / `userId` from session
- All store-scoped queries `enabled: Boolean(storeId)`
- Notifications scoped by `userId`
- Guards: loading / unauthenticated / no store linked
- No mock order/message fallbacks
- No self-assigned store id on product create
