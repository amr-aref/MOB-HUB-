---
name: Review system device-identity pattern
description: How review ownership is handled without auth (Sprint A2)
---

## Rule
Reviews store a `userId` column (nullable text). The mobile client generates a UUID v4 on first launch, persists it to AsyncStorage as `@marketplace_device_id`, and sends it as `userId` on every review CUD request.

**Why:** Auth is deferred to Sprint C+. Edit/delete ownership must still work within a single device session.

**How to apply:**
- `useDeviceId()` hook in `artifacts/mobile/hooks/useDeviceId.ts` provides the value (null on first render)
- Server ownership check: `if (review.userId && review.userId !== userId) → 403`
- Client only shows edit/delete buttons when `review.userId === deviceId && deviceId !== null`
- Duplicate check server-side: one review per (userId, storeId) → 409

**Limitation:** Per-device ownership. Clearing app data or re-installing loses ownership of previous reviews. Resolved by real auth in Sprint C+.
