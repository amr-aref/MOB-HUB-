import app from "./app";
import { logger } from "./lib/logger";
import { reservationWorker } from "./services/reservationWorker";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // ── Background workers ──────────────────────────────────────────────────
  // Start after the HTTP server is bound so startup failures are reported
  // before any background processing begins.
  reservationWorker.start();
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
// Stop background workers before exiting so in-flight batches complete cleanly.

function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown signal received");
  reservationWorker.stop();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
