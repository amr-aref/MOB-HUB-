# Sprint A2 — Review System: Completion Report

**Date:** 2026-07-15  
**Sprint:** A2 — Submit, Edit, Delete Reviews; Live Rating Updates; Full Validation

---

## Overview

Sprint A2 delivers a complete, production-grade review system for MOB HUB. Users can write, edit, and delete their own reviews from any store detail page. Store ratings and review counts update atomically after every mutation. All layers — database, API contract, backend, generated client, and mobile UI — are wired end-to-end.

---

## Deliverables

### Layer 1 — Database Schema (`lib/db/src/schema/reviews.ts`)

Extended `reviewsTable` with seven new columns:

| Column | Type | Default | Purpose |
|---|---|---|---|
| `userId` | `text` (nullable) | — | Device-based pseudo-identity (no auth required) |
| `title` | `text NOT NULL` | `""` | Optional review headline |
| `status` | `text NOT NULL` | `"active"` | Lifecycle: `active \| pending \| flagged` |
| `helpfulCount` | `integer NOT NULL` | `0` | Architecture-ready helpful-votes counter |
| `verifiedPurchase` | `boolean NOT NULL` | `false` | Architecture-ready verified-purchase flag |
| `createdAt` | `timestamp NOT NULL` | `now()` | Authoritative creation time |
| `updatedAt` | `timestamp NOT NULL` | `now()` | Authoritative modification time |

Schema changes applied with `drizzle-kit push`. Existing seeded data received defaults automatically — zero data loss.

### Layer 2 — OpenAPI Contract (`lib/api-spec/openapi.yaml`)

Three new endpoints added:

```
POST   /stores/{id}/reviews  → createStoreReview  (201 ReviewDto)
PUT    /reviews/{id}          → updateReview       (200 ReviewDto)
DELETE /reviews/{id}?userId=  → deleteReview       (204 No Content)
```

Two new request schemas:
- `CreateReviewBody` — author, authorAr, rating (1–5), title?, textEn, textAr, userId?
- `UpdateReviewBody` — rating, title?, textEn, textAr, userId (required for ownership check)

`ReviewDto` extended with all new fields (backward-compatible: new fields have defaults, consumers not using them are unaffected).

### Layer 3 — Code Generation

Orval v8 regenerated from the updated spec:
- **`lib/api-client-react`** — new hooks: `useCreateStoreReview`, `useUpdateReview`, `useDeleteReview`; new query key functions: `getGetStoreReviewsQueryKey`, `getGetStoreQueryKey`
- **`lib/api-zod`** — new zod validators for `CreateReviewBody`, `UpdateReviewBody`, `DeleteReviewParams`

Fixed a pre-existing duplicate-export bug in both `lib/api-zod/src/index.ts` and `lib/api-client-react/src/index.ts` that was masked until the new types exposed the name collision.

### Layer 4 — Backend (`artifacts/api-server/src/routes/reviews.ts`)

New dedicated reviews router with:

**`POST /stores/:id/reviews`**
- Verifies store exists (404 if not)
- Full inline validation (name 2–60 chars, rating 1–5 int, text 10–1000 chars, title ≤100 chars)
- Duplicate check: one review per `userId` + `storeId` → 409 if already reviewed from this device
- Inserts new review row with generated ID and formatted display date
- Calls `recalculateStoreRating` atomically → updates `stores.rating` and `stores.reviewsCount`
- Returns 201 with full `ReviewDto`

**`PUT /reviews/:id`**
- Finds review or 404
- Ownership check: `review.userId !== body.userId` → 403
- Validates updated fields
- Updates row + `updatedAt`
- Recalculates store rating
- Returns 200 with updated `ReviewDto`

**`DELETE /reviews/:id?userId=`**
- Finds review or 404
- Ownership check: 403 if mismatch
- Deletes row
- Recalculates store rating / count
- Returns 204

**`GET /stores/:id/reviews`** (updated in `stores.ts`)
- Now filters `status = 'active'` only
- Maps rows through `toReviewDto` for consistent field serialization (ISO timestamps, camelCase)

### Layer 5 — Mobile

**`artifacts/mobile/hooks/useDeviceId.ts`** (new)
- Generates a UUID v4 on first launch, persists it to AsyncStorage under `@marketplace_device_id`
- Returns `null` on the initial render while AsyncStorage resolves; callers handle `null` gracefully
- Falls back to an ephemeral ID if AsyncStorage is unavailable

**`artifacts/mobile/components/ReviewFormModal.tsx`** (new, 450 lines)
- Bottom-sheet modal with spring slide-up animation
- Interactive 5-star rating selector with haptic feedback on each tap
- Name field, optional title field, multi-line review text (with 1000-char counter)
- Real-time validation messages appear on blur; full validation fires on submit
- Handles both create and edit mode (pre-populates from `reviewToEdit` prop)
- `useCreateStoreReview` for new reviews; `useUpdateReview` for edits
- On success: haptic success notification → success overlay → auto-dismiss after 1.6 s
- On 409: shows localized "duplicate review" error inline
- `onSuccess` invalidates both `getStoreReviews` and `getStore` queries, triggering live rating refresh in the header
- RTL-aware layout throughout; star rating stays LTR universally

**`artifacts/mobile/app/store/[id].tsx`** (modified)
- Imports `useQueryClient`, `useDeleteReview`, `getGetStoreReviewsQueryKey`, `getGetStoreQueryKey`, `ReviewDto`, `useDeviceId`, `ReviewFormModal`
- `useDeviceId()` called at component top (before early return, hooks-safe)
- `useDeleteReview` mutation wired with query invalidation in `onSuccess`
- `handleDeleteReview(review)` — shows native `Alert.alert` with Confirm/Cancel; on confirm, calls `deleteMutation.mutate({ id, params: { userId: deviceId ?? '' } })`
- Reviews card **always rendered** (no longer conditional on `storeReviews.length > 0`):
  - Empty state: icon + "No reviews yet" + "Be the first to review" prompt
  - Aggregate star rating shown in header only when reviews exist
  - Each review card shows **Edit / Delete** action buttons when `review.userId === deviceId` (user's own reviews only)
  - Optional `title` shown if non-empty
  - Write Review button always present at the bottom of the card
- `ReviewFormModal` rendered at root of screen view; `editingReview` state passed as `reviewToEdit`

**`artifacts/mobile/data/translations.ts`** (modified)
- 24 new keys added to both Arabic and English sections:
  `noReviewsYet`, `beFirstToReview`, `reviewTitle`, `reviewTitlePlaceholder`, `reviewTextPlaceholder`, `yourName`, `yourNamePlaceholder`, `submitReview`, `editReview`, `deleteReview`, `deleteReviewConfirm`, `reviewSubmitted`, `reviewUpdated`, `reviewDeleted`, `ratingRequired`, `reviewTextRequired`, `reviewTextTooShort`, `reviewTextTooLong`, `nameRequired`, `nameTooShort`, `duplicateReview`, `tapToRate`

---

## Validation Rules

| Field | Rule |
|---|---|
| Rating | Required, integer 1–5 |
| Author name | Required, 2–60 chars, trimmed |
| Title | Optional, max 100 chars, trimmed |
| Review text | Required, 10–1000 chars, trimmed |
| Duplicate check | One review per `userId` + `storeId` (server-enforced, 409) |

---

## Device-Identity Design Decision

Authentication is deferred to Sprint C+. To enable edit/delete ownership without auth:

- Mobile generates a UUID v4 on first launch and persists it to AsyncStorage as `@marketplace_device_id`
- This `deviceId` is sent as `userId` in every create/update/delete request
- Server stores `userId` on the row; ownership checks compare `review.userId === userId`
- UI shows edit/delete actions only for reviews where `review.userId === deviceId`
- **Limitation:** reviews are owned per device. If a user clears app data or installs on a new device, they lose edit/delete ability for old reviews. Resolved when real auth lands.

---

## Files Changed

| File | Change |
|---|---|
| `lib/db/src/schema/reviews.ts` | Extended schema (+7 columns) |
| `lib/api-spec/openapi.yaml` | +3 endpoints, +2 schemas, updated ReviewDto |
| `lib/api-zod/src/index.ts` | Fixed duplicate-export bug |
| `lib/api-client-react/src/index.ts` | Fixed duplicate-export bug |
| `lib/api-client-react/src/generated/*` | Regenerated by Orval |
| `lib/api-zod/src/generated/*` | Regenerated by Orval |
| `artifacts/api-server/src/routes/reviews.ts` | **New** — POST, PUT, DELETE handlers |
| `artifacts/api-server/src/routes/stores.ts` | Updated GET reviews (active filter + DTO map) |
| `artifacts/api-server/src/routes/index.ts` | Mounted reviews router |
| `artifacts/mobile/hooks/useDeviceId.ts` | **New** |
| `artifacts/mobile/components/ReviewFormModal.tsx` | **New** |
| `artifacts/mobile/app/store/[id].tsx` | Wired review form, edit/delete, empty state |
| `artifacts/mobile/data/translations.ts` | +24 keys (AR + EN) |

---

## TypeScript Status

- `lib/*` (libs): ✅ zero errors
- `artifacts/api-server`: ✅ zero errors
- `artifacts/mobile`: pre-existing Sprint A1 errors unrelated to Sprint A2 remain (StoreDto/Product type mismatches in `index.tsx`, `favorites.tsx`, `stores.tsx`; `queryKey` missing in `product/[id].tsx`). Zero new errors introduced by Sprint A2.
