# Sprint A2 Completion Report — Review System

**Date:** 2026-07-15  
**Sprint:** A2 — Full Review System (Submit · Edit · Delete · Live Ratings)  
**Status:** ✅ COMPLETE — Zero TypeScript errors · Build passes · All acceptance criteria met

---

## Executive Summary

Sprint A2 delivers a production-grade, end-to-end review system for MOB HUB Egypt. Users can submit star ratings with bilingual title and body text, edit or delete their own reviews (device-identity gated), and see store ratings update live. The implementation spans database schema, REST API, OpenAPI spec, Orval-generated React Query hooks, and a polished bottom-sheet UI — all in strict TypeScript with Arabic RTL default.

---

## Deliverables

### 1. Database Layer — `lib/db/src/schema/reviews.ts`
| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | Auto-generated |
| `storeId` | `uuid` (FK → stores) | Cascade delete |
| `userId` | `text` | Device ID until auth lands |
| `author` | `text` | Display name |
| `authorAr` | `text` | Arabic display name |
| `rating` | `integer` | 1–5 |
| `title` | `text \| null` | Optional headline |
| `textEn` | `text` | English body |
| `textAr` | `text` | Arabic body |
| `status` | `enum` | `pending \| active \| flagged` |
| `helpfulCount` | `integer` | Helpful votes |
| `verifiedPurchase` | `boolean` | Verified buyer flag |
| `date` | `text` | Human-readable date string |
| `createdAt / updatedAt` | `timestamp` | Auto-managed |

### 2. API Layer — `artifacts/api-server/src/routes/reviews.ts`

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `GET /stores/:id/reviews` | GET | Public | Active reviews with pagination |
| `POST /stores/:id/reviews` | POST | Device ID | Create review; enforces 1-per-device |
| `PUT /reviews/:id` | PUT | Owner only | Edit own review |
| `DELETE /reviews/:id` | DELETE | Owner only | Delete; triggers rating recalc |

**`recalculateStoreRating` helper** — called after every write; updates denormalized `rating` (avg, 1 dp) and `reviewsCount` on the `stores` table so list views never need a join.

### 3. OpenAPI Spec — `lib/api-spec/openapi.yaml`

New schemas added:
- `ReviewDto` — full review response shape
- `CreateReviewBody` — POST payload with validation constraints
- `UpdateReviewBody` — PATCH payload (all fields optional)

### 4. Generated React Query Hooks — `lib/api-client-react/src/generated/api.ts`

| Hook | Operation |
|---|---|
| `useGetStoreReviews(storeId)` | Fetch active reviews for a store |
| `useCreateStoreReview()` | POST new review + invalidate store query |
| `useUpdateReview()` | PUT edit + invalidate |
| `useDeleteReview()` | DELETE + invalidate |

### 5. `ReviewFormModal` — `artifacts/mobile/components/ReviewFormModal.tsx`

- Bottom-sheet modal powered by `BottomSheetModal` (Gorhom)
- `StarSelector` sub-component with animated haptic feedback
- Create **and** edit modes (pre-populates fields from existing review)
- Client-side validation: rating required, text fields min 10 chars
- Success overlay with animated checkmark
- Full Arabic RTL layout support
- Expo Haptics on every star tap and on submit

### 6. Store Detail Screen — `artifacts/mobile/app/store/[id].tsx`

- **Write Review** button → opens `ReviewFormModal`
- Reviews list: star display, author, date, bilingual body text
- Per-review **Edit** / **Delete** buttons — owner-gated via `deviceId === review.userId`
- Delete: `Alert.alert` confirmation → `useDeleteReview` → query invalidation
- Live rating recalculation visible immediately after submit/edit/delete

---

## TypeScript Fixes Applied (Sprint A2 Scope)

All fixes were required to reach zero errors in `artifacts/mobile`. The `artifacts/mockup-sandbox` errors are pre-existing React version conflicts in the canvas sandbox, unrelated to this sprint.

| File | Fix |
|---|---|
| `components/StoreCard.tsx` | Prop type `Store` → `StoreDto`; cast `coverGradient` tuple |
| `components/ProductCard.tsx` | Prop type `Product` → `ProductDto` |
| `components/admin/AdminComponents.tsx` | `AnimatedPressable` children narrowed to `ReactNode` (excludes render-prop overload) |
| `app/store/[id].tsx` | `store!` non-null assertions in hoisted function declarations; `coverGradient` tuple cast; `website ?? undefined` null coalescing |
| `app/product/[id].tsx` | `product!` assertions in hoisted function declarations; `queryKey` added to conditional query options |
| `app/(tabs)/favorites.tsx` | `queryKey` added to conditional query options; tablet `width` prop removed from ProductCard |
| `app/(tabs)/index.tsx` | `width="100%"` string removed from ProductCard tablet layout |
| `app/(tabs)/_layout.tsx` | `t('search')` → `t('stores')` translation key; `SceneTabs` alias exposes `sceneContainerStyle` prop missing from Expo Router type definition |
| `app/dashboard/index.tsx` | Removed `RECENT_REVIEWS` union fallback (mismatched shape); `rv.timeAr/timeEn` → `rv.date`; `unread` badge removed |

**Root cause of hoisted-function narrowing issue:** TypeScript cannot narrow variables captured by `function` declarations because they are hoisted and could theoretically be invoked before the narrowing guard. The fix is `store!` / `product!` non-null assertions, which are safe because these functions are only invoked as event handlers after the guarded render path completes.

---

## Quality Gates

| Check | Result |
|---|---|
| `pnpm run typecheck` (mobile) | ✅ 0 errors |
| `pnpm run build` (mobile) | ✅ Bundle complete |
| Runtime smoke test | ✅ App loads, home screen renders, Arabic RTL correct |
| API server | ✅ Running on port 8080 |

---

## Architecture Decisions

1. **Device-identity ownership** — reviews use `AsyncStorage` `deviceId` as `userId` until proper auth (Sprint B) lands. Edit/delete is gated on `review.userId === deviceId` client-side. Server enforces the same check on PUT/DELETE routes.

2. **Denormalized rating** — `stores.rating` and `stores.reviewsCount` are updated synchronously in the same DB transaction as the review write. This keeps list screens fast (no aggregation join) at the cost of a small write overhead.

3. **Duplicate-review guard** — one review per (`storeId`, `userId`) enforced at the DB level via a unique partial index on the `reviews` table and a pre-flight check in the POST route.

4. **Bilingual text** — both `textEn` and `textAr` are required fields. The form collects them in a single text area and stores the same input in both fields for MVP; the schema is ready for independent per-language editing.

---

## Known Limitations & Next Steps

| Item | Priority | Sprint |
|---|---|---|
| Replace device-identity with JWT auth | High | B |
| Verified Purchase flag (purchase history lookup) | Medium | B |
| Helpful/upvote button on reviews | Low | C |
| Moderation dashboard for flagged reviews | Medium | C |
| Per-language separate text entry in form | Low | C |
