# MH-001 — Session `storeId` binding

## Status on `fix/mh-001-session-storeid`

| File | Status |
|------|--------|
| `dashboard/reservations.tsx` | **Full fix committed** |
| `dashboard/index.tsx` | Interim shell + **patch ready** |
| `dashboard/add-product.tsx` | Interim shell + **patch ready** |

## Apply full UI (local — recommended)

```bash
git fetch origin
git checkout fix/mh-001-session-storeid
git pull

# Restore full screens from main
git checkout main -- \
  artifacts/mobile/app/dashboard/index.tsx \
  artifacts/mobile/app/dashboard/add-product.tsx

# Apply MH-001 patches
git apply artifacts/mobile/patches/mh-001-index.patch
git apply artifacts/mobile/patches/mh-001-add-product.patch

# Verify
grep -nE "STORE_ID|'s1'" \
  artifacts/mobile/app/dashboard/index.tsx \
  artifacts/mobile/app/dashboard/add-product.tsx \
  artifacts/mobile/app/dashboard/reservations.tsx \
  && echo FAIL || echo OK

pnpm --filter @workspace/mobile exec tsc --noEmit
git add artifacts/mobile/app/dashboard/index.tsx artifacts/mobile/app/dashboard/add-product.tsx
git commit -m "fix(mobile): MH-001 full dashboard UI bound to session storeId"
git push
```

## Guarantees (no architecture change)
- No backend / schema / route changes
- Tenant scope only via session `user.storeId`
- Queries disabled until `storeId` present
- Product create cannot send hardcoded `s1`
