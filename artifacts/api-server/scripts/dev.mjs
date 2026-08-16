import { spawn } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const isWindows = process.platform === 'win32';
const pnpmCommand = isWindows ? 'pnpm.cmd' : 'pnpm';
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, '..');

function run(command, args, label, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      env: process.env,
      shell: false,
    });

    child.on('error', (error) => {
      console.error(`\n[dev] ${label} failed to start:`, error);
      reject(error);
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        console.error(`\n[dev] ${label} terminated by signal: ${signal}`);
        reject(new Error(`${label} exited via signal ${signal}`));
        return;
      }

      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} exited with code ${code}`));
    });
  });
}

async function main() {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  try {
    await run(pnpmCommand, ['run', 'build'], 'build', packageDir);
  } catch (error) {
    console.error('\n[dev] Build failed. Server will not start.');
    process.exitCode = 1;
    return;
  }

  const entryPoint = path.resolve(packageDir, 'dist/index.mjs');

  try {
    await run(
      process.execPath,
      ['--enable-source-maps', entryPoint],
      'api-server',
      packageDir,
    );
  } catch (error) {
    console.error('\n[dev] API server failed to start.');
    process.exitCode = 1;
  }
}

main();
