---
name: Notification system architecture
description: How the centralized notifications feature (DB, API, mobile) is wired and known gaps.
---

- `notificationsTable` (`lib/db/src/schema/notifications.ts`) is the single store for all notification types (see `NOTIFICATION_TYPES` array there — add new types by extending that array, no migration needed since `type` is free text).
- `userId` on a notification is a generic recipient key: a buyer's device UUID (from `useDeviceId`) or a seller's storeId — same pseudo-identity convention as reviews/conversations (no real auth yet).
- All notification reads/writes go through `artifacts/api-server/src/services/notificationService.ts` (repository pattern) — route handlers and other feature routes (e.g. reviews.ts, conversations.ts) call `createNotification()` instead of touching the table directly, so fan-out (push/websockets) has one integration point later.
- Mobile screens must go through `artifacts/mobile/hooks/useNotifications.ts`, not the raw generated React Query hooks — it centralizes the list/unread-count/mark-read/mark-all/delete calls and cache invalidation.
- The Notification Center screen (`app/notifications/index.tsx`) is shared by buyer and seller entry points: caller passes `?userId=` (seller bells pass the storeId; buyer entry points fall back to the device UUID once loaded).

**Known scope gap:** only `new_message` (conversations.ts) and `review_received` (reviews.ts) have real triggers, because those are the only mutating endpoints that exist. `new_order`/`order_status_updated` have no write endpoint yet (orders are read-only/seeded), and `store_follow`/`favorite_price_change`/`promotional_campaign`/`system_announcement` have no owning feature (no follow system, no price-watch job, no admin/campaign tool) — these types exist in the schema/service and are exercised only via seed data until those features are built.

**Why:** avoids inventing fake business flows (e.g. a fabricated order-approval or follow system) just to wire every notification type end-to-end.

**Pre-existing, unrelated issue:** `pnpm -w run typecheck` fails on several mobile files (`app/dashboard/index.tsx`, `app/messages/*.tsx`, and now `hooks/useNotifications.ts`) with "Property 'queryKey' is missing" — this is a pre-existing repo-wide TS/react-query generic inference gap unrelated to any one feature (verified via `git stash` before this work); new hooks should match the existing pattern rather than trying to fix it in isolation.
