---
name: Reservation G.6 Reliability Architecture
description: Sprint G.6 decisions — transaction integrity, optimistic locking, audit trail, background worker
---

## What was added

### New DB table: `reservation_audit_log`
- Columns: id, reservation_id (FK cascade), from_status (null on CREATED), to_status, actor, actor_type ('buyer'|'merchant'|'system'), reason, metadata (JSON string), created_at
- Written INSIDE the same transaction as the status update — atomically committed or rolled back together

### New column: `reservations.expired_at` (timestamp, nullable)
- Set by the background worker when a pending reservation auto-expires

### New notification type: `reservation_expired`
- Sent to the buyer when the system auto-expires their pending reservation

## State machine fix
`ALLOWED_TRANSITIONS` was missing `pending → expired`. Fixed in G.6.
Terminal states: declined, cancelled, expired, completed — none allow further transitions.

## Concurrency / idempotency pattern
All state transition functions (confirm, decline, cancel, complete, expire) use **optimistic locking**:
1. SELECT current state inside transaction (no FOR UPDATE needed — see Why below)
2. UPDATE ... WHERE id=X AND status=<expected_from_state>
3. If 0 rows affected: re-SELECT to check if already in target state → idempotent return, else throw TransitionError

**Why:** Postgres serializes writes on the same row via MVCC. The WHERE clause on status in the UPDATE is the lock — a second concurrent update with the same WHERE sees the committed status and gets 0 rows, then detects the idempotent case.

## Background worker
- `artifacts/api-server/src/services/reservationWorker.ts`
- Singleton `ReservationWorker` class, started in `artifacts/api-server/src/index.ts` after the HTTP server binds
- Interval: 60s, batch limit: 50, runs first tick immediately at startup
- `isRunning` flag prevents overlapping batches
- Graceful shutdown: SIGTERM/SIGINT call `reservationWorker.stop()`
- Each reservation processed in its own transaction; individual failures are logged and skipped without aborting the batch

## fetchWithContext optimization
Changed from 3 separate SELECTs to a single JOIN query (reservation + product + store in one round-trip). Used by getReservation and all post-transition DTO construction.

## listReservations N+1 fix
Batch-fetches products and stores using `inArray` + `Promise.all` — one query per entity type regardless of list size.

## History endpoint
`GET /reservations/:id/history?buyerId=X` (or storeId=X) — returns ordered audit log entries. Access-controlled via the same participant check as GET /reservations/:id.
