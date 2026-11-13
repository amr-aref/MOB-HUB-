/**
 * Cross-platform Expo dev launcher (Windows / macOS / Linux).
 * Replit-specific env wiring is optional and only applied when those vars exist.
 */
import { spawn } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const isWindows = process.platform === 'win32';
const pnpmCommand = isWindows ? 'pnpm.cmd' : 'pnpm';
const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const port = process.env.EXPO_PORT || process.env.PORT || '8081';

const env = { ...process.env };

// Optional Replit host mapping — only when the host already provides these.
if (process.env.REPLIT_EXPO_DEV_DOMAIN) {
  env.EXPO_PACKAGER_PROXY_URL = `https://${process.env.REPLIT_EXPO_DEV_DOMAIN}`;
}
if (process.env.REPLIT_DEV_DOMAIN) {
  env.EXPO_PUBLIC_DOMAIN = process.env.REPLIT_DEV_DOMAIN;
  env.REACT_NATIVE_PACKAGER_HOSTNAME = process.env.REPLIT_DEV_DOMAIN;
}
if (process.env.REPL_ID) {
  env.EXPO_PUBLIC_REPL_ID = process.env.REPL_ID;
}

const child = spawn(
  pnpmCommand,
  ['exec', 'expo', 'start', '--localhost', '--port', String(port)],
  {
    cwd: packageDir,
    stdio: 'inherit',
    env,
    shell: isWindows,
  },
);

child.on('error', (error) => {
  console.error('[mobile dev] failed to start:', error);
  process.exitCode = 1;
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 0;
});
