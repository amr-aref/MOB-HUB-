import { findExpirationCandidates, expireReservation } from "./reservationService";
import { logger } from "../lib/logger";

// ---------------------------------------------------------------------------
// Reservation Expiration Worker — Sprint G.6
// ---------------------------------------------------------------------------
// Runs on a fixed interval inside the API server process.
// Responsibilities:
//   • Find all pending reservations past their expiresAt deadline
//   • Expire them atomically (one transaction per reservation)
//   • Each expiration is idempotent: safe to retry if the process restarts
//
// Design decisions:
//   • isRunning flag prevents a slow batch from overlapping with the next tick
//   • Each reservation processed in its own transaction to minimise lock time
//     and maximise throughput under concurrent load
//   • Failures on individual reservations are logged but do not abort the batch
//   • The worker is started at server startup and stopped on SIGTERM/SIGINT
// ---------------------------------------------------------------------------

const INTERVAL_MS   = 60_000; // Run every 60 seconds.
const BATCH_LIMIT   = 50;     // Process at most N reservations per tick.

export class ReservationWorker {
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  /** Start the background tick. Safe to call multiple times (no-op if running). */
  start(): void {
    if (this.intervalHandle !== null) return;

    logger.info({ intervalMs: INTERVAL_MS, batchLimit: BATCH_LIMIT }, "Reservation worker started");

    // Run once immediately, then on every interval.
    void this.tick();
    this.intervalHandle = setInterval(() => void this.tick(), INTERVAL_MS);
  }

  /** Stop the background tick. In-flight batch completes before the worker exits. */
  stop(): void {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      logger.info("Reservation worker stopped");
    }
  }

  // ─── Core tick ─────────────────────────────────────────────────────────────

  private async tick(): Promise<void> {
    if (this.isRunning) {
      logger.warn("Reservation worker tick skipped — previous batch still running");
      return;
    }

    this.isRunning = true;
    try {
      await this.processExpirations();
    } catch (err) {
      logger.error({ err }, "Unhandled error in reservation worker tick");
    } finally {
      this.isRunning = false;
    }
  }

  // ─── Expiration batch ──────────────────────────────────────────────────────

  private async processExpirations(): Promise<void> {
    const candidates = await findExpirationCandidates(BATCH_LIMIT);

    if (candidates.length === 0) return;

    logger.info({ count: candidates.length }, "Processing expired reservations");

    let expired  = 0;
    let skipped  = 0;
    let failures = 0;

    for (const id of candidates) {
      try {
        const result = await expireReservation(id);
        if (result) {
          expired++;
          logger.info({ reservationId: id }, "Reservation auto-expired");
        } else {
          // Another worker or concurrent request already handled it.
          skipped++;
        }
      } catch (err) {
        failures++;
        logger.error({ err, reservationId: id }, "Failed to expire reservation");
        // Continue processing remaining candidates — one failure must not
        // block the rest of the batch.
      }
    }

    if (expired > 0 || failures > 0) {
      logger.info({ expired, skipped, failures }, "Reservation expiration batch complete");
    }
  }
}

/** Singleton worker instance. Import and call start() at server startup. */
export const reservationWorker = new ReservationWorker();
