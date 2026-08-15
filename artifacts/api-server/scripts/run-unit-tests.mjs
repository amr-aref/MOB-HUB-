/**
 * Cross-platform runner for pure reservation unit tests.
 *
 * Why this exists:
 * - The previous package.json script used Unix env assignment
 *   (`DATABASE_URL=... command`), which fails on Windows cmd/PowerShell.
 * - `@workspace/db` throws if DATABASE_URL is missing at import time,
 *   even though these unit tests never open a real connection.
 *
 * Scope: set a dummy DATABASE_URL when unset, then run node:test via tsx.
 * No production code paths are modified.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const testFile = path.join(
  packageRoot,
  "src",
  "services",
  "reservationService.test.ts",
);

const env = {
  ...process.env,
  DATABASE_URL:
    process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== ""
      ? process.env.DATABASE_URL.trim()
      : "postgres://test:test@127.0.0.1:5432/test",
};

// Use the workspace db package's tsx binary (same as the previous script),
// with an absolute test path so Windows and Unix resolve identically.
const result = spawnSync(
  "pnpm",
  ["--filter", "@workspace/db", "exec", "tsx", "--test", testFile],
  {
    env,
    cwd: packageRoot,
    stdio: "inherit",
    // Required on Windows so `pnpm.cmd` is resolved.
    shell: true,
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);
