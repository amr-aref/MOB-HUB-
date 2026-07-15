# Sprint G.0 — Reservation Architecture & Domain Design
**MOB HUB | Enterprise Mobile Phone Marketplace | Egypt**
*Architecture Report — Design Only, No Implementation*

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Reservation Domain Overview](#2-reservation-domain-overview)
3. [State Machine](#3-state-machine)
4. [Database Architecture](#4-database-architecture)
5. [Entity Relationships](#5-entity-relationships)
6. [API Architecture](#6-api-architecture)
7. [Mobile Flow](#7-mobile-flow)
8. [Merchant Flow](#8-merchant-flow)
9. [Customer Flow](#9-customer-flow)
10. [Dashboard Integration](#10-dashboard-integration)
11. [Conversation Integration](#11-conversation-integration)
12. [Notification Integration](#12-notification-integration)
13. [Product Lifecycle](#13-product-lifecycle)
14. [Edge Cases](#14-edge-cases)
15. [Security Considerations](#15-security-considerations)
16. [Scalability Considerations](#16-scalability-considerations)
17. [Future Compatibility](#17-future-compatibility)
18. [Risks](#18-risks)
19. [Recommendations](#19-recommendations)
20. [Sprint G.1 Implementation Roadmap](#20-sprint-g1-implementation-roadmap)

---

## 1. Executive Summary

MOB HUB is a mobile-first marketplace for buying and comparing phones across Egypt. The business model is **browse → reserve → visit store** — there is no checkout, cart, or online payment. Reservation is the terminal in-app action; everything upstream leads to it.

Sprint G.0 designs the **Reservation Domain** as a first-class aggregate, consistent with the existing DDD-influenced architecture. The domain integrates non-destructively with the following existing systems:

| Existing System | Integration Point |
|---|---|
| `products` table | New `availabilityStatus` field; write-through on reservation state change |
| `conversations` + `chat_messages` | Auto-create or reuse conversation on reservation creation; system messages for state transitions |
| `notifications` | Six new event types wired through the existing notification service |
| `dashboard_stats` | New reservation KPIs surfaced alongside existing metrics |
| Device UUID identity | `buyerId` on reservation maps to existing anonymous identity pattern |
| React Query codegen | New hooks generated from new OpenAPI endpoints; no hook changes to existing features |

No existing table, route, hook, screen, or UI is modified. All changes are additive.

---

## 2. Reservation Domain Overview

### 2.1 Business Context

The reservation workflow is the commercial handshake between an anonymous buyer and a physical store:

```
Customer browsing
    ↓
Product Detail Screen
    ↓
"Reserve This Device" CTA
    ↓
Reservation Created  ──────── PENDING
    ↓
Conversation auto-created / linked
    ↓
Merchant reviews & decides
    ├── CONFIRMED → Customer visits store → COMPLETED
    └── DECLINED  → Customer tries elsewhere
    ↓ (either party)
CANCELLED at any point before COMPLETED
    ↓ (system)
EXPIRED if merchant doesn't respond in time
```

### 2.2 Domain Boundaries

The Reservation aggregate owns:
- The reservation record and its lifecycle
- The product availability signal (written through to `products.availabilityStatus`)
- Reservation-scoped system messages posted to the linked conversation
- Reservation-scoped notifications fired on each state transition

The Reservation aggregate does **not** own:
- The conversation itself (owned by the Conversation domain)
- The product listing (owned by the Product domain)
- The notification delivery mechanism (owned by the Notification service)

### 2.3 Actors

| Actor | Identity | Capabilities |
|---|---|---|
| **Buyer** | `buyerId` = device UUID (existing `useDeviceId` pattern) | Create, Cancel |
| **Merchant** | `storeId` (existing seller identity) | Confirm, Decline, Cancel, Complete |
| **System** | Internal scheduler / event handler | Expire, post system messages, fire notifications |

---

## 3. State Machine

### 3.1 States

| State | Meaning | Terminal? |
|---|---|---|
| `pending` | Reservation created; awaiting merchant decision | No |
| `confirmed` | Merchant accepted; customer expected to visit | No |
| `declined` | Merchant rejected the request | **Yes** |
| `cancelled` | Either party cancelled before completion | **Yes** |
| `expired` | System auto-cancelled after TTL with no merchant response | **Yes** |
| `completed` | Merchant marked the in-store visit as done | **Yes** |

### 3.2 Transition Table

```
FROM        → TO            ACTOR       TRIGGER              GUARD
─────────────────────────────────────────────────────────────────────
pending     → confirmed     merchant    Confirm action        Must own store
pending     → declined      merchant    Decline action        Must own store
pending     → cancelled     buyer       Cancel action         Must be buyer
pending     → cancelled     merchant    Cancel action         Must own store
pending     → expired       system      TTL elapsed (48h)     cron / scheduled job
confirmed   → completed     merchant    Complete action       Must own store
confirmed   → cancelled     buyer       Cancel action         Must be buyer
confirmed   → cancelled     merchant    Cancel action         Must own store
```

### 3.3 Invalid Transitions (explicitly rejected with 409)

```
pending     → completed     (skip confirmation step)
declined    → *             (terminal)
cancelled   → *             (terminal)
expired     → *             (terminal)
completed   → *             (terminal)
confirmed   → pending       (no regression)
confirmed   → declined      (must cancel, not decline)
```

### 3.4 Automatic Transitions

| Trigger | From | To | Condition |
|---|---|---|---|
| Scheduled job (every 15 min) | `pending` | `expired` | `expiresAt < NOW()` |
| Product deleted by merchant | `pending` or `confirmed` | `cancelled` | cascade, `cancelledBy = 'system'` |

### 3.5 State Machine Diagram

```
                    ┌─────────────────────────────────┐
                    │                                 │
             [buyer cancel]               [merchant cancel]
                    │                                 │
  ┌─────────────────▼──────────────────────────────────▼──────┐
  │                                                            │
CREATE ──► PENDING ──────[merchant confirm]──────► CONFIRMED ──[merchant complete]──► COMPLETED
              │                                       │
              │ [merchant decline]                    │ [buyer cancel / merchant cancel]
              │                                       │
              ▼                                       ▼
           DECLINED                             CANCELLED (cancelledBy: buyer|merchant)
              │
              │ [system TTL]
              ▼
           EXPIRED
```

---

## 4. Database Architecture

### 4.1 New Table: `reservations`

The primary aggregate root. One row per reservation attempt.

```
reservations
─────────────────────────────────────────────────────
id                text          PRIMARY KEY           cuid2
productId         text          NOT NULL FK→products.id  ON DELETE RESTRICT
storeId           text          NOT NULL FK→stores.id    ON DELETE RESTRICT  [denormalized]
buyerId           text          NOT NULL               device UUID
conversationId    text          NULL FK→conversations.id ON DELETE SET NULL
status            text          NOT NULL DEFAULT 'pending'
                                CHECK: ('pending','confirmed','declined',
                                        'cancelled','expired','completed')
cancelledBy       text          NULL
                                CHECK: ('buyer','merchant','system')
cancellationReason text         NULL                   free text (max 500)
buyerNotes        text          NULL                   notes at creation (max 500)
expiresAt         timestamptz   NOT NULL               createdAt + 48h
confirmedAt       timestamptz   NULL
declinedAt        timestamptz   NULL
cancelledAt       timestamptz   NULL
completedAt       timestamptz   NULL
createdAt         timestamptz   NOT NULL DEFAULT now()
updatedAt         timestamptz   NOT NULL DEFAULT now()
deletedAt         timestamptz   NULL                   soft delete
```

**Indexes:**
```sql
-- Fast merchant lookup: "show me all reservations for my store"
idx_reservations_store_status        ON reservations (storeId, status)

-- Fast buyer lookup: "show me my reservations"
idx_reservations_buyer_status        ON reservations (buyerId, status)

-- Expiry cron: "find all expired pending reservations"
idx_reservations_expires_pending     ON reservations (expiresAt)
                                     WHERE status = 'pending'

-- CRITICAL: Concurrency guard — only one active reservation per product
-- This unique partial index is the database-level enforcement of
-- "one product, one reservation at a time"
idx_reservations_product_active      UNIQUE ON reservations (productId)
                                     WHERE status IN ('pending', 'confirmed')
                                     AND deletedAt IS NULL
```

**Constraints:**
- `cancelledBy` must be non-null when `status = 'cancelled'`
- `confirmedAt` must be non-null when `status = 'confirmed'`
- Enforced at the application layer (not in CHECK constraints, for flexibility)

### 4.2 New Table: `reservation_timeline`

Immutable append-only audit log for every state change. Enables reservation history, dispute resolution, and analytics.

```
reservation_timeline
─────────────────────────────────────────────────────
id                text          PRIMARY KEY           cuid2
reservationId     text          NOT NULL FK→reservations.id  ON DELETE CASCADE
event             text          NOT NULL
                                ('created','confirmed','declined',
                                 'cancelled','expired','completed',
                                 'note_added')
actorType         text          NOT NULL
                                ('buyer','merchant','system')
actorId           text          NOT NULL               buyerId | storeId | 'system'
metadata          jsonb         NULL                   {reason, note, previousStatus}
createdAt         timestamptz   NOT NULL DEFAULT now()
```

**Index:**
```sql
idx_timeline_reservation   ON reservation_timeline (reservationId, createdAt)
```

**No updates, no deletes** on this table. Append-only by convention. Cascade delete from `reservations` is acceptable only on hard-delete of the parent (which should never happen in production — use soft delete).

### 4.3 Modified: `products` Table

Add one column to signal availability to browsing customers and to prevent duplicate reservations from being created by the UI layer (the DB constraint is the authoritative lock, but the product status is the user-facing signal).

```
ALTER TABLE products
  ADD COLUMN availabilityStatus text NOT NULL DEFAULT 'available'
  CHECK availabilityStatus IN ('available', 'reserved', 'unavailable');
```

**Write-through rule (application-level):**
| Reservation Event | Product `availabilityStatus` Written |
|---|---|
| Reservation `created` | → `reserved` |
| Reservation `declined` | → `available` |
| Reservation `cancelled` | → `available` |
| Reservation `expired` | → `available` |
| Reservation `completed` | → `unavailable` (sold, out of stock) |

The write to `products.availabilityStatus` must be **atomic with the reservation status update** (same DB transaction).

**Note:** A future `sold` status or `quantity` field for multi-unit products is out of scope for Sprint G but is not blocked by this design — `availabilityStatus` can be extended with additional enum values without schema breakage.

### 4.4 Modified: `notifications` — Enum Extension

The `notifications.type` enum (currently: `new_message`, `new_order`, `order_status_updated`, `review_received`, `product_approved`, `product_rejected`, `store_follow`, `favorite_price_change`, `promotional_campaign`, `system_announcement`) must be extended with:

```
reservation_created           -- fired to merchant
reservation_confirmed         -- fired to buyer
reservation_declined          -- fired to buyer
reservation_cancelled         -- fired to the other party
reservation_expired           -- fired to both parties
reservation_completed         -- fired to buyer
reservation_reminder_buyer    -- system reminder (future)
reservation_reminder_merchant -- system reminder (future)
```

This is an additive change — no existing notification types are altered.

### 4.5 Cascade & Soft Delete Policy

| Action | Behavior |
|---|---|
| Merchant deletes product | Reservation → CANCELLED (system), `availabilityStatus` → available; reservation row is NOT hard-deleted (audit trail preserved) |
| Store deactivated | Active reservations → system-cancelled with `cancellationReason = 'store_inactive'` |
| Hard delete `reservations` row | Blocked by convention; use `deletedAt` soft delete |
| Hard delete `reservation_timeline` row | Never. Append-only. |

---

## 5. Entity Relationships

```
stores (1) ─────────── (N) reservations
products (1) ────────── (N) reservations  [unique partial index enforces 0 or 1 active]
conversations (1) ────── (N) reservations  [same conv reused per buyer+store+product]
reservations (1) ──────── (N) reservation_timeline
reservations (1) ──────── (N) notifications  [indirectly, via userId on notification]
```

```
                      ┌──────────────────┐
                      │     stores       │
                      │  id, nameAr/En   │
                      └────────┬─────────┘
                               │ storeId (FK, denorm)
                               │
              ┌────────────────▼─────────────────────────────────────┐
              │                  reservations                        │
              │  id, productId, storeId, buyerId, conversationId,   │
              │  status, cancelledBy, buyerNotes, expiresAt, ...    │
              └───┬──────────────┬─────────────────┬────────────────┘
                  │              │                 │
           (FK)   │         (FK) │            (FK) │
                  │              │                 │
    ┌─────────────▼──┐   ┌───────▼──────┐  ┌──────▼─────────────────┐
    │   products     │   │conversations │  │  reservation_timeline  │
    │  + avail.      │   │  (reused by  │  │  id, reservationId,    │
    │    Status      │   │  triple-key) │  │  event, actorType, ... │
    └────────────────┘   └──────────────┘  └────────────────────────┘
```

---

## 6. API Architecture

All endpoints live under `/api/reservations`. They conform to the existing Express 5 + Zod validation + DTO pattern used across the codebase.

### 6.1 Endpoint Catalogue

#### Buyer Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/api/reservations` | Create a new reservation for a product | buyerId (device UUID) |
| `GET` | `/api/reservations` | List reservations for a buyer (`?buyerId=`) | buyerId |
| `GET` | `/api/reservations/:id` | Get full reservation detail | buyer or merchant |
| `PATCH` | `/api/reservations/:id/cancel` | Buyer cancels a reservation | buyerId must match |
| `GET` | `/api/reservations/:id/timeline` | Reservation event history | buyer or merchant |

#### Merchant Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/api/reservations` | List reservations for a store (`?storeId=`) | storeId |
| `PATCH` | `/api/reservations/:id/confirm` | Merchant confirms reservation | storeId must match |
| `PATCH` | `/api/reservations/:id/decline` | Merchant declines reservation | storeId must match |
| `PATCH` | `/api/reservations/:id/cancel` | Merchant cancels a confirmed reservation | storeId must match |
| `PATCH` | `/api/reservations/:id/complete` | Merchant marks customer visited | storeId must match |

#### Query Parameters for List Endpoint (`GET /api/reservations`)

| Param | Type | Description |
|---|---|---|
| `buyerId` | string | Filter by buyer (mutual exclusive with storeId) |
| `storeId` | string | Filter by store |
| `status` | string (enum) | Filter by status |
| `productId` | string | Filter by product |
| `limit` | integer | Pagination (default 20, max 50) |
| `offset` | integer | Pagination offset |
| `sortBy` | string | `createdAt` (default) or `updatedAt` |
| `sortOrder` | string | `asc` or `desc` (default `desc`) |

### 6.2 Request / Response Shapes (Schema Contract)

**`POST /api/reservations` Request:**
```json
{
  "productId": "string (required)",
  "buyerId": "string (required, device UUID)",
  "buyerNotes": "string (optional, max 500 chars)"
}
```

**`POST /api/reservations` Response (201):**
```json
{
  "id": "res_xxx",
  "productId": "...",
  "storeId": "...",
  "buyerId": "...",
  "conversationId": "...",
  "status": "pending",
  "expiresAt": "2026-07-17T17:00:00Z",
  "createdAt": "..."
}
```

**Mutation Responses (200):** Return the full updated `ReservationDto`.

**Error Responses:**
| HTTP | Condition |
|---|---|
| 409 | Product already has an active reservation (concurrency guard) |
| 409 | Buyer already has a pending/confirmed reservation on this product |
| 404 | Reservation not found |
| 403 | Actor does not have permission for this transition |
| 422 | Invalid state transition (e.g. attempting to confirm an already-declined reservation) |

### 6.3 `ReservationDto` Shape

```typescript
interface ReservationDto {
  id: string;
  productId: string;
  product: { nameAr: string; nameEn: string; price: number; image: string };
  storeId: string;
  store: { nameAr: string; nameEn: string; logo: string };
  buyerId: string;
  conversationId: string | null;
  status: ReservationStatus;
  cancelledBy: 'buyer' | 'merchant' | 'system' | null;
  cancellationReason: string | null;
  buyerNotes: string | null;
  expiresAt: string;           // ISO8601
  confirmedAt: string | null;
  declinedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ReservationTimelineEntryDto {
  id: string;
  event: TimelineEvent;
  actorType: 'buyer' | 'merchant' | 'system';
  actorId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
```

### 6.4 OpenAPI Spec Integration

New paths, components, and schemas are added to `lib/api-spec/openapi.yaml`. Running `pnpm --filter @workspace/api-spec run codegen` regenerates `@workspace/api-client-react` and `@workspace/api-zod` with zero changes to existing generated symbols.

---

## 7. Mobile Flow

### 7.1 Navigation Architecture

The Reservation domain introduces three new route segments into the existing Expo Router structure:

```
app/
├── reservation/
│   ├── [id].tsx          ← Reservation Detail Screen (buyer view)
│   └── new.tsx           ← Reservation Creation Screen (modal)
├── (tabs)/
│   └── reservations.tsx  ← My Reservations tab (buyer)
└── dashboard/
    └── reservations/
        ├── index.tsx     ← Merchant Reservations List
        └── [id].tsx      ← Merchant Reservation Detail
```

The `reservation/new` screen is presented as a **modal card** (consistent with how `product/[id]` and `store/[id]` are presented in the existing Stack navigator). It receives `productId` and `storeId` as route params.

### 7.2 Screen Inventory

| Screen | Route | Actor | Purpose |
|---|---|---|---|
| Reservation Creation | `reservation/new?productId=&storeId=` | Buyer | Form with optional notes, CTA to confirm |
| Reservation Detail (Buyer) | `reservation/[id]` | Buyer | Status display, cancel action, link to chat |
| My Reservations | `(tabs)/reservations` | Buyer | List of all buyer's reservations |
| Merchant Reservations List | `dashboard/reservations` | Merchant | Pending / recent list |
| Merchant Reservation Detail | `dashboard/reservations/[id]` | Merchant | Confirm / decline / complete actions |

### 7.3 Product Detail Screen Integration

The existing `product/[id].tsx` screen receives one change: the primary CTA logic.

**Current state:** A "Contact Seller" button that navigates to `conversations`.

**New state (additive):**
- If `product.availabilityStatus === 'available'`: show **"Reserve This Device"** primary CTA + **"Chat with Seller"** secondary CTA
- If `product.availabilityStatus === 'reserved'`: show **"Product is Reserved"** disabled badge + **"Chat with Seller"**
- If `product.availabilityStatus === 'unavailable'`: show **"Sold / Unavailable"** badge

No logic in the existing product screen is removed. The availability status is read from the `ProductDto` (which gains the new field).

### 7.4 Loading, Empty, and Error States

| State | Screen | Behaviour |
|---|---|---|
| Loading reservations | My Reservations | Skeleton cards (3 placeholders) |
| Empty — no reservations | My Reservations | Illustration + "Browse phones to make your first reservation" CTA |
| Empty — no pending | Merchant Dashboard widget | "No pending reservations" inline message |
| Error — fetch failed | All screens | Toast with retry button; cached stale data shown if available |
| Error — create failed (409) | Creation modal | Inline error: "This device was just reserved by another customer" |
| Error — transition failed | Detail screen | Toast; state refreshed from server |

### 7.5 Offline Behaviour

| Scenario | Behaviour |
|---|---|
| Browse reservations offline | Show React Query stale cache; show "Last updated X ago" banner |
| Create reservation offline | Block action with toast: "You need an internet connection to reserve a device" |
| Confirm / decline offline | Block with toast; no optimistic updates for state transitions |
| App returns online | React Query refetch triggered on `appStateChangeHandler`; conversation polling resumes |

---

## 8. Merchant Flow

### 8.1 Reservation Lifecycle from Merchant Perspective

```
Dashboard → "Pending Reservations" widget (badge count)
    ↓
Merchant Reservations List Screen
    ↓
Tap a reservation → Merchant Reservation Detail
    ↓
See: Product image, buyer notes, when it expires
    ↓
       ├── [Confirm]  → status: confirmed → chat notification to buyer
       ├── [Decline]  → status: declined → chat notification to buyer
       └── [Cancel]   → status: cancelled → chat notification to buyer
    ↓ (if confirmed)
Mark as Completed when customer visits
```

### 8.2 Merchant Reservation Detail Screen

Content:
- Product card (image, name, price)
- Buyer initials / masked ID
- Buyer notes (if provided)
- Expiry countdown (`expiresAt` - now)
- Conversation link ("View Chat")
- Reservation timeline (audit log entries)
- Action buttons based on current status

State-based action buttons:
| `status` | Available Actions |
|---|---|
| `pending` | Confirm, Decline, Cancel |
| `confirmed` | Mark as Completed, Cancel |
| `declined` | None (display only) |
| `cancelled` | None (display only) |
| `expired` | None (display only) |
| `completed` | None (display only) |

### 8.3 Dashboard Reservation Widget

Positioned in the existing Dashboard quick-action / stats area:

- **Pending badge**: count of `status = 'pending'` reservations for the store
- **Today's reservations**: count created in last 24h
- **Quick list**: top 3 most recent pending reservations with product name and time ago
- **"View All" CTA**: navigates to `dashboard/reservations`

---

## 9. Customer Flow

### 9.1 Reservation Creation Flow

```
Product Detail Screen
    ↓
Tap "Reserve This Device"
    ↓
Reservation Creation Modal
  ├── Product summary card (image, name, price)
  ├── Optional notes textarea (Arabic / English depending on locale)
  └── "Confirm Reservation" primary CTA
    ↓
POST /api/reservations
    ↓
  [Success] ──► Navigate to Reservation Detail Screen
                Chat auto-opens alongside (or deep-linked from detail)
  [409 conflict] ──► "Already reserved by another customer — you can still chat"
  [Network error] ──► Toast with retry
```

### 9.2 My Reservations Tab

A new tab in the bottom navigation (or a section under Profile if tab count is constrained). Lists all reservations for the current `deviceId`.

Grouped display:
- **Active** (`pending` / `confirmed`)
- **Past** (`completed` / `cancelled` / `declined` / `expired`)

Each reservation card shows:
- Product image + name
- Store name
- Status badge (color-coded: orange=pending, green=confirmed, red=declined/cancelled, grey=expired, teal=completed)
- Time since created / time until expiry (for pending)
- CTA: "View Details" or "Cancel" (if still cancellable)

### 9.3 Buyer Reservation Detail Screen

Content:
- Status header with colored indicator
- Product card
- Store card with map link
- Reservation notes (buyer's own notes)
- Expiry date / confirmed date
- "Open Chat" button (navigates to `messages/[conversationId]`)
- Reservation timeline (visible events: created, confirmed, etc.)
- Cancel button (if `status` is `pending` or `confirmed`)

---

## 10. Dashboard Integration

### 10.1 New KPI Widgets

To be added alongside existing `dashboard_stats` display:

| Metric | Description | Data Source |
|---|---|---|
| Pending Reservations | Count of `pending` for this store | `reservations` query |
| Confirmed Today | Count of `confirmed` in last 24h | `reservations` query |
| Completed (30d) | Count of `completed` in last 30 days | `reservations` query |
| Conversion Rate | `completed / (confirmed + completed)` over 30d | Derived |
| Avg. Confirmation Time | Median time from `pending` → `confirmed` | `reservation_timeline` |

### 10.2 Dashboard Stats Table Extension

The existing `dashboard_stats` table carries `totalSales` and `totalOrders`. Reservation metrics are **not** written into `dashboard_stats` — they are queried live from `reservations` to ensure accuracy. If performance demands it in the future, a materialized view or a scheduled aggregation job is the correct solution.

### 10.3 Filters and Search on Merchant List

| Filter | Values |
|---|---|
| Status | All, Pending, Confirmed, Completed, Cancelled |
| Date range | Today, Last 7 days, Last 30 days, Custom |
| Product | Free-text search against product name |

### 10.4 Reservation Badges

- **Navigation badge on Dashboard tab**: total count of `pending` reservations (same pattern as existing unread message count)
- **Reservation Detail button**: orange pulse animation for `pending` status (merchant urgency signal)

---

## 11. Conversation Integration

### 11.1 Conversation Lifecycle

When a reservation is created:

1. The API checks whether a conversation already exists for the triple-key `(buyerId, storeId, productId)` — identical to existing idempotency logic in `conversations.ts`.
2. If a conversation exists: reuse it. Set `reservations.conversationId = existing.id`.
3. If no conversation exists: create one. Set `reservations.conversationId = new.id`.
4. Post a **system message** into the conversation:
   ```
   [SYSTEM] 🔔 تم تقديم طلب حجز على {product.nameAr} — {product.nameEn}
   Reservation ID: {reservationId}
   ```

All subsequent reservation state transitions also post system messages to the same conversation:

| Event | System Message (bilingual) |
|---|---|
| Confirmed | ✅ تم تأكيد الحجز — Reservation confirmed |
| Declined | ❌ تم رفض الحجز — Reservation declined |
| Cancelled by buyer | ↩️ ألغى العميل الحجز — Customer cancelled |
| Cancelled by merchant | ↩️ ألغى المتجر الحجز — Merchant cancelled |
| Expired | ⏱ انتهت صلاحية الحجز — Reservation expired |
| Completed | 🎉 تم اكتمال الحجز — Visit completed |

### 11.2 Reservation Context Card in Chat

The chat screen (`messages/[id].tsx`) renders a **pinned context card** at the top of the thread when the conversation has an associated active reservation. The card shows:

- Product thumbnail + name
- Reservation status badge
- Expiry timer (if `pending`)
- Action shortcuts (Confirm / Decline for merchant; Cancel for buyer)

The card is dismissible and does not appear for `completed`, `declined`, `cancelled`, or `expired` reservations (clean state).

### 11.3 Conversation Reuse Policy

| Scenario | Behaviour |
|---|---|
| Buyer contacts store about same product again after reservation | Same conversation reused; new system message posted |
| Buyer reserves a different product at the same store | New conversation created (different `productId`) |
| Reservation cancelled; buyer re-reserves same product | Same conversation reused; new `reservationId` created |

---

## 12. Notification Integration

### 12.1 Notification Events

All events use the existing `notifications` table and follow the existing `userId` + `metadata` + `type` schema.

| Event Type | Recipient `userId` | Trigger | `metadata` |
|---|---|---|---|
| `reservation_created` | `storeId` (merchant) | Buyer creates reservation | `{reservationId, productId, productNameAr, productNameEn, buyerNotes}` |
| `reservation_confirmed` | `buyerId` (device UUID) | Merchant confirms | `{reservationId, productId, storeNameAr, storeNameEn, storeAddress}` |
| `reservation_declined` | `buyerId` | Merchant declines | `{reservationId, productId, storeNameAr, cancellationReason?}` |
| `reservation_cancelled` | opposite party | Either party cancels | `{reservationId, productId, cancelledBy, cancellationReason?}` |
| `reservation_expired` | `buyerId` + `storeId` | System TTL | `{reservationId, productId}` |
| `reservation_completed` | `buyerId` | Merchant marks complete | `{reservationId, productId, storeNameAr, storeNameEn}` |

### 12.2 In-App Notification Display

The existing `notifications/index.tsx` screen uses a `type` to render icons and copy. The six new types receive:

| Type | Icon | Arabic Copy | English Copy |
|---|---|---|---|
| `reservation_created` | 📦 | تم استلام طلب حجز جديد | New reservation request received |
| `reservation_confirmed` | ✅ | تم تأكيد حجزك | Your reservation is confirmed |
| `reservation_declined` | ❌ | تم رفض طلب الحجز | Your reservation was declined |
| `reservation_cancelled` | ↩️ | تم إلغاء الحجز | Reservation was cancelled |
| `reservation_expired` | ⏱ | انتهت صلاحية الحجز | Reservation expired |
| `reservation_completed` | 🎉 | اكتمل الحجز | Reservation completed |

### 12.3 Badge Updates

- Merchant notification badge (existing header unread count) increments on `reservation_created`
- Buyer notification badge increments on `reservation_confirmed`, `reservation_declined`, `reservation_cancelled`, `reservation_completed`
- Both badge counts decrement on `markAsRead` (existing behavior, no change)

### 12.4 Deep Link Targets from Notifications

| Notification Type | Deep Link Target |
|---|---|
| `reservation_created` | `dashboard/reservations/[reservationId]` |
| `reservation_confirmed` | `reservation/[reservationId]` |
| `reservation_declined` | `reservation/[reservationId]` |
| `reservation_cancelled` | `reservation/[reservationId]` |
| `reservation_expired` | `reservation/[reservationId]` |
| `reservation_completed` | `reservation/[reservationId]` |

---

## 13. Product Lifecycle

### 13.1 `availabilityStatus` State Machine

```
         [reservation created]        [confirmed]
available ────────────────────► reserved ──────────► (still reserved)
    ▲                               │
    │  [declined / cancelled /       │ [completed]
    │   expired]                     ▼
    └──────────────────────── unavailable
```

### 13.2 Availability Signals to Buyers

| `availabilityStatus` | Product Card Badge | Detail Screen CTA |
|---|---|---|
| `available` | None | "Reserve This Device" (primary) |
| `reserved` | "محجوز / Reserved" (orange) | "Unavailable — Reserved" (disabled) + "Chat" |
| `unavailable` | "نفذت الكمية / Sold" (grey) | "Unavailable" (disabled) |

### 13.3 Multi-Unit Future Consideration

The current design assumes **one physical unit per product listing** (typical for second-hand phone marketplaces). If a store lists a product with quantity > 1 in the future, the `availabilityStatus` field becomes insufficient. A `quantityAvailable` integer column and a `DECREMENT` on reservation creation would be needed.

This is not in scope for Sprint G but the additive column design (`availabilityStatus` as a separate field rather than derived-only) supports this extension cleanly.

---

## 14. Edge Cases

### 14.1 Concurrency: Two Buyers Reserve Simultaneously

**Scenario:** Buyers A and B both tap "Reserve" on the same product within milliseconds.

**Resolution:**
- The unique partial index `idx_reservations_product_active` (on `productId` WHERE `status IN ('pending', 'confirmed')`) makes one INSERT win at the DB level.
- The losing INSERT raises a unique constraint violation.
- The API catches this and returns `409 Conflict` with body: `{ error: 'product_already_reserved', message: '...' }`.
- The buyer sees: "This device was just reserved by another customer. You can contact the seller to join a waitlist."
- No phantom reservations exist.

### 14.2 Merchant Confirms Another Customer's Reservation (Double Booking)

**Scenario:** Merchant has two `pending` reservations for the same product (edge case: index prevents this from the creation path; should not occur in steady state).

**Resolution:** The unique partial index prevents two `pending`/`confirmed` reservations for the same `productId`. This is structurally impossible in the DB.

### 14.3 Reservation Timeout

**Scenario:** Merchant does not respond within 48 hours.

**Resolution:**
- Scheduled job (every 15 minutes) queries `reservations WHERE status = 'pending' AND expiresAt < NOW()`.
- For each expired row: status → `expired`, `updatedAt` = now, product `availabilityStatus` → `available`.
- Timeline event: `{event: 'expired', actorType: 'system'}`.
- Notifications fired to both `buyerId` and `storeId`.

### 14.4 Merchant Deletes Product

**Scenario:** Merchant deletes a product that has an active (`pending` or `confirmed`) reservation.

**Resolution:**
- Product deletion is **blocked** if an active reservation exists. API returns `409: 'product_has_active_reservation'`.
- Merchant must first cancel the reservation, then delete the product.
- Alternatively (softer): product is soft-deleted (`deletedAt`), reservation is auto-cancelled by system, notifications fired.
- **Recommended:** Block deletion. Forcing the merchant to cancel explicitly creates a clear audit trail.

### 14.5 Customer Cancels After Confirmation

**Scenario:** Merchant confirmed; buyer cancels.

**Resolution:**
- Allowed transition: `confirmed → cancelled (cancelledBy: buyer)`.
- Product `availabilityStatus` → `available`.
- Notification to merchant: `reservation_cancelled`.
- System message in chat: "↩️ ألغى العميل الحجز".

### 14.6 Merchant Cancels After Confirmation

**Scenario:** Merchant confirms then realizes they can't fulfil (product damaged, sold in-store, etc.).

**Resolution:**
- Allowed transition: `confirmed → cancelled (cancelledBy: merchant)`.
- Merchant provides a `cancellationReason` (required for merchant-initiated cancellation of confirmed reservations — UI enforces this).
- Product `availabilityStatus` → `available`.
- Notification to buyer: `reservation_cancelled` with `cancellationReason` in metadata.

### 14.7 Duplicate Reservation Attempts by Same Buyer

**Scenario:** Buyer already has a `pending` or `confirmed` reservation for a product and tries to create another.

**Resolution:**
- Application-level check before DB INSERT: query for `{buyerId, productId, status IN ('pending', 'confirmed')}`.
- If found, return `409: 'duplicate_reservation'`.
- No DB constraint required (the unique partial index covers the cross-buyer case; this check covers the same-buyer case).

### 14.8 Race Condition: Create + Cancel Simultaneously

**Scenario:** Buyer creates reservation (race with their own rapid taps).

**Resolution:**
- Idempotent creation: application checks for existing active reservation before inserting.
- For double-tap: UI disables the CTA immediately on first tap (local state); API also guards with the duplicate check.

### 14.9 Offline Synchronization

**Scenario:** Buyer creates reservation, app goes offline before response; or merchant confirms while seller app is in background.

**Resolution:**
- Reservation creation requires online confirmation — no offline queueing (a reservation that didn't reach the server does not exist).
- When the app comes back online, React Query's `refetchOnReconnect` (already configured globally) refreshes the reservation and notification state.
- If the server responded with success but the client timed out, the next `GET /api/reservations?buyerId=` call reveals the existing reservation — duplicate creation attempt returns `409`.

### 14.10 Merchant Blocks Customer

Not currently in scope (no block system exists). If implemented in a future sprint, a blocked `buyerId` would be rejected at `POST /api/reservations` before DB write. This requires no schema change to reservations.

### 14.11 Product Becomes Unavailable After Reservation

**Scenario:** Store marks product as `unavailable` manually (e.g., already sold in-store before reservation flow exists).

**Resolution:**
- Product availability update is blocked if an active reservation exists (same guard as product deletion).
- If merchant needs to override: must cancel reservation first.

---

## 15. Security Considerations

### 15.1 Identity & Authorization

The current app uses device UUID (`buyerId`) for anonymous buyer identity and `storeId` for merchant identity. There is no server-side session or token for buyers.

**Implications for reservations:**
- Any actor who supplies a valid `buyerId` can create or cancel a reservation on its behalf.
- The `buyerId` must be validated: minimum length, UUID format, not blank.
- Sensitive reservation data (buyer notes, merchant responses) is accessible to anyone who knows the `reservationId`. The current architecture has no secrets beyond IDs — this is acceptable for the anonymous model but should be revisited if PII is added.

**Merchant actions** (`confirm`, `decline`, `cancel`, `complete`): the `storeId` in the request body / query param is matched against `reservations.storeId`. This is equivalent to the existing pattern where seller dashboard operations use `storeId` as the identity claim. It has the same trust model as the rest of the app.

### 15.2 Rate Limiting

The existing `express-rate-limit` applies a strict limit on `POST/PUT/PATCH/DELETE`. The `/api/reservations` `POST` endpoint should be covered by this existing limit. No additional rate limiting is needed for Sprint G.

Consider adding a **per-buyerId reservation creation rate limit** (e.g., max 5 reservations per hour per device) to prevent reservation spamming. This is a future hardening item.

### 15.3 Input Validation

All reservation creation and mutation requests must be validated with Zod at the route layer (consistent with existing patterns):
- `productId`: valid cuid2 format
- `buyerId`: valid UUID format
- `buyerNotes`: max 500 characters, sanitized
- `cancellationReason`: max 500 characters, sanitized

### 15.4 IDOR Prevention

Reservation detail (`GET /api/reservations/:id`) must verify that the requesting actor (`buyerId` or `storeId` in query params) matches the reservation's `buyerId` or `storeId`. Returning 404 (not 403) for unauthorized access prevents reservation ID enumeration.

---

## 16. Scalability Considerations

### 16.1 Query Performance

The index strategy in §4.1 covers the three primary query patterns:
- **Merchant**: `(storeId, status)` — covered by `idx_reservations_store_status`
- **Buyer**: `(buyerId, status)` — covered by `idx_reservations_buyer_status`
- **Expiry cron**: `(expiresAt) WHERE status = 'pending'` — covered by `idx_reservations_expires_pending`

The `reservation_timeline` table uses `(reservationId, createdAt)` for efficient per-reservation history queries.

### 16.2 Write Throughput

The unique partial index on `(productId) WHERE status IN ('pending', 'confirmed')` introduces a serialization point for concurrent reservations on the same product. At MOB HUB's expected scale (Egypt mobile phone market, single-unit listings), this is not a bottleneck — it is the desired behaviour. For a hypothetical multi-unit product, a `FOR UPDATE SKIP LOCKED` advisory lock pattern would be needed.

### 16.3 Expiry Job

A lightweight scheduled job querying `reservations WHERE status = 'pending' AND expiresAt < NOW()` every 15 minutes is sufficient for the expected volume. This can be implemented as:
- A `setInterval` inside the API server process (simplest, acceptable for current scale)
- A `pg_cron` job (preferred for reliability; decoupled from process restarts)
- A Replit scheduled deployment (future)

### 16.4 Notification Volume

Each reservation transition fires 1–2 notifications. For 1,000 daily reservations this is 2,000–4,000 notification writes per day — negligible for PostgreSQL.

---

## 17. Future Compatibility

The design explicitly reserves space for the following future capabilities:

| Future Feature | How This Design Accommodates It |
|---|---|
| **Deposit payments** | `reservations` table gains `depositAmount`, `depositStatus`, `depositPaidAt`; state machine gains `deposit_pending` sub-state; no structural redesign |
| **Store pickup scheduling** | `reservations` gains `scheduledPickupAt`; `confirmed` transition returns a time slot; `reservation_timeline` records slot changes |
| **Appointment booking** | Same as pickup scheduling; `reservation_timeline` provides the audit trail |
| **Reservation history / CRM** | `reservation_timeline` is the source of truth; no additional schema needed |
| **Admin moderation** | `reservations` gains `moderationStatus`; `actorType = 'admin'` in timeline |
| **Multi-unit products** | `products.quantityAvailable` column + remove unique partial index → replace with quantity decrement; `availabilityStatus` becomes derived |
| **Push notifications** | `notifications.metadata` already carries `reservationId` for deep linking; push token table added independently |
| **Analytics** | `reservation_timeline` + `reservations` are analytics-ready; a reporting view or materialized table can be derived without schema changes |
| **Waitlist** | New `reservation_waitlist` table (buyerId + productId + position + createdAt); promoted to reservation when active slot clears |

---

## 18. Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| Anonymous buyer identity is spoofable | Medium | Low-Medium | Current architecture accepts this tradeoff; no PII in reservation payload mitigates impact |
| Race condition at DB level before index is applied | High | Low | Unique partial index must be applied **before** the reservation endpoint goes live |
| Expiry job fails silently | Medium | Low | Job must log every run; alerting on silence (future) |
| Merchant ignores reservations → poor buyer experience | High | Medium | UX: pending reservations surface prominently in dashboard; expiry ensures eventual resolution |
| Product `availabilityStatus` out of sync after crash mid-transaction | Medium | Low | Atomic write (single transaction) for reservation status + product status update eliminates this |
| Scope creep during G.1 toward payment concepts | High | Medium | Explicit architectural guardrail: no Checkout, Cart, or Payment domain. Enforce in code review. |
| Conversation auto-creation creates orphan conversations | Low | Low | Triple-key idempotency prevents duplicates; `conversationId` on reservation creates traceability |

---

## 19. Recommendations

1. **Adopt the unique partial index as the concurrency contract.** Do not rely on application-level checks alone for the "one active reservation per product" rule. The DB constraint is the authority; the application check is the user-experience layer.

2. **Implement the expiry job using `pg_cron` inside the managed PostgreSQL instance** (if Replit's PostgreSQL supports it) rather than a `setInterval` in the API server. This decouples the job from process restarts and deploys. If `pg_cron` is unavailable, a separate long-running worker process is the next-best option.

3. **Treat `reservation_timeline` as immutable from day one.** Do not add UPDATE or DELETE logic to it. Design the API to post new events rather than modify existing ones. This discipline pays dividends in debugging and compliance.

4. **Require `cancellationReason` for merchant-initiated cancellations of confirmed reservations.** A buyer who travelled toward the store deserves an explanation. Enforce in the API (422 if missing for this specific transition) and in the UI.

5. **Keep `availabilityStatus` write-through synchronous within the reservation transaction.** Do not make it eventually consistent (e.g., via a background job). A buyer should never see a product as "available" when it has an active reservation.

6. **Surface expiry countdowns to the merchant, not just the buyer.** A merchant who sees "7 hours left to confirm" acts. A merchant who sees nothing lets reservations expire. The dashboard pending list should show urgency indicators.

7. **Design the "Reserve" CTA language for the Egyptian market.** Arabic copy should be validated by a native speaker. Suggested: **"احجز الجهاز"** (Reserve the device) rather than a literal translation of "Reserve".

8. **Do not introduce a "waitlist" in Sprint G.1.** Wait for real user feedback on whether buyers actually want to waitlist on reserved products before building it. The architecture supports it (see §17) but the demand is unvalidated.

---

## 20. Sprint G.1 Implementation Roadmap

Sprint G.1 translates this architecture into production code. Recommended sequencing for a single engineer or a small team:

### Phase 1 — Database (Day 1)

- [ ] Add `availabilityStatus` column to `products` table (Drizzle schema + `drizzle-kit push`)
- [ ] Create `reservations` table with all columns, indexes, and constraints
- [ ] Create `reservation_timeline` table with index
- [ ] Extend `notifications.type` enum with 6 new event types
- [ ] Seed script: add sample reservations for development

### Phase 2 — API (Days 2–3)

- [ ] Write `ReservationDto` and Zod schemas in `lib/api-spec/openapi.yaml`
- [ ] Run codegen to generate hooks and validators
- [ ] Implement `routes/reservations.ts` with all 10 endpoints
- [ ] Implement service layer: state machine, product write-through, timeline append
- [ ] Implement notification firing on each transition
- [ ] Implement conversation auto-create/reuse on reservation creation
- [ ] Implement system message posting on state transitions
- [ ] Implement expiry job (initial: `setInterval`; upgrade path: `pg_cron`)
- [ ] Register router in `app.ts`
- [ ] Manual test all endpoints with curl / Postman

### Phase 3 — Mobile: Foundation (Days 4–5)

- [ ] Extend `ProductDto` + product screen to read `availabilityStatus`
- [ ] Product Detail Screen: conditional CTA (Reserve / Reserved badge / Unavailable)
- [ ] Reservation Creation Modal (`reservation/new.tsx`)
- [ ] Reservation Detail Screen (buyer view, `reservation/[id].tsx`)
- [ ] My Reservations Tab (`(tabs)/reservations.tsx`)

### Phase 4 — Mobile: Merchant (Day 6)

- [ ] Merchant Reservations List (`dashboard/reservations/index.tsx`)
- [ ] Merchant Reservation Detail (`dashboard/reservations/[id].tsx`)
- [ ] Dashboard pending reservations widget + badge
- [ ] Action buttons: Confirm, Decline, Cancel, Complete

### Phase 5 — Mobile: Conversation & Notifications (Day 7)

- [ ] Chat screen: pinned reservation context card
- [ ] System messages rendered in chat thread (`senderType: 'system'` already supported)
- [ ] Notification screen: 6 new event type icons and copy
- [ ] Deep links from notifications to reservation screens

### Phase 6 — QA & Polish (Day 8)

- [ ] End-to-end flow test: buyer creates → merchant confirms → buyer views chat → merchant completes
- [ ] Concurrency test: two devices reserve same product simultaneously
- [ ] Expiry test: set short TTL in dev, confirm cron fires and state changes
- [ ] RTL / Arabic locale pass on all new screens
- [ ] Empty and error states on all new screens
- [ ] Typecheck: `pnpm run typecheck` passes with zero errors

### Deliverables of Sprint G.1

- All 10 API endpoints live and tested
- 5 new mobile screens (buyer + merchant)
- Product availability reflected in product listing and detail screens
- Notifications wired for all 6 reservation events
- Conversations auto-linked to reservations
- Dashboard reservation widget with badge
- Zero regressions in existing features

---

*Document prepared for MOB HUB Sprint G.0 — Architecture Design Only.*
*No source code, migrations, or production changes were made in producing this document.*
*Authors: Architecture Review — July 2026*
