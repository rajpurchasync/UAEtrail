import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveRuntimeEnv } from './resolve-runtime-env.mjs';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const resolveCommand = (command) => {
  if (process.platform === 'win32' && command === 'npm') {
    return 'npm.cmd';
  }

  return command;
};

const parseMode = () => {
  const modeFromEnv = (process.env.RUN_PROJECT_MODE || '').toLowerCase();
  if (modeFromEnv === 'fast' || modeFromEnv === 'dev') {
    return 'fast';
  }
  if (modeFromEnv === 'docker' || modeFromEnv === 'deploy') {
    return 'docker';
  }

  for (const arg of process.argv.slice(2)) {
    if (arg === '--fast' || arg === '--dev') return 'fast';
    if (arg === '--docker' || arg === '--deploy') return 'docker';
  }

  return 'docker';
};

const runCommand = (command, args, env) =>
  new Promise((resolve, reject) => {
    const isWindowsNpm = process.platform === 'win32' && command === 'npm';
    const child = spawn(isWindowsNpm ? 'cmd' : resolveCommand(command), isWindowsNpm ? ['/d', '/s', '/c', 'npm.cmd', ...args] : args, {
      cwd: rootDir,
      env,
      stdio: 'inherit',
      shell: false
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${command} terminated by signal ${signal}`));
        return;
      }
      resolve(code ?? 1);
    });
  });

const waitForUrl = async (url, attempts, delayMs) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.ok) {
        return true;
      }
    } catch {
      // Keep retrying until the frontend is reachable.
    }

    if (attempt + 1 < attempts) {
      console.log(`Waiting for app URL ${url} ... (${attempt + 1}/${attempts})`);
      await sleep(delayMs);
    }
  }

  return false;
};

const startFastDevStack = async (env) => {
  console.log(`[4/5] Starting fast VS Code dev stack for RUN_ENV=${env.RUN_ENV} using ${env.MONGODB_URI_SOURCE}...`);

  let exitCode = await runCommand('docker', ['compose', 'up', '-d', '--wait', '--wait-timeout', '120', 'redis', 'minio'], env);
  if (exitCode !== 0) {
    console.error('Infra startup failed.');
    process.exit(exitCode);
  }

  console.log('Infra containers are running. Launching hot-reload dev servers...');
  exitCode = await runCommand('npm', ['run', 'dev:all'], env);
  process.exit(exitCode);
};

const startDockerStack = async (env) => {
  console.log(`[4/5] Bringing up all containers for RUN_ENV=${env.RUN_ENV} using ${env.MONGODB_URI_SOURCE}...`);
  let exitCode = await runCommand('docker', ['compose', 'build', 'api'], env);
  if (exitCode !== 0) {
    console.error('API build failed.');
    process.exit(exitCode);
  }

  exitCode = await runCommand('docker', ['compose', 'up', '-d', '--wait', '--wait-timeout', '240'], env);
  if (exitCode !== 0) {
    console.log('Initial compose startup had failures. Retrying full stack every 5 seconds...');
    for (let retryAttempt = 1; retryAttempt <= 24; retryAttempt += 1) {
      console.log(`Retry ${retryAttempt}/24 in 5 seconds...`);
      await sleep(5000);
      exitCode = await runCommand('docker', ['compose', 'up', '-d', '--wait', '--wait-timeout', '120'], env);
      if (exitCode === 0) {
        break;
      }
    }
  }

  if (exitCode !== 0) {
    console.error('One or more containers could not be recovered.');
    await runCommand('docker', ['compose', 'ps', '-a'], env);
    await runCommand('docker', ['compose', 'logs', '--tail', '80', 'api'], env);
    await runCommand('docker', ['compose', 'logs', '--tail', '80', 'frontend'], env);
    process.exit(exitCode);
  }

  console.log('Containers are running.');
  console.log('[5/5] Seeding API data (with retries)...');

  for (let seedAttempt = 0; seedAttempt < 12; seedAttempt += 1) {
    exitCode = await runCommand('docker', ['compose', 'exec', '-T', 'api', 'npm', '--workspace', '@uaetrail/api', 'run', 'seed'], env);
    if (exitCode === 0) {
      break;
    }

    if (seedAttempt === 11) {
      console.log('Seed still failing after 12 tries. Containers are running; seed can be retried later.');
      break;
    }

    console.log(`API not ready for seed yet. Retrying... (${seedAttempt + 1}/12)`);
    await sleep(5000);
  }

  const frontendUrl = `http://localhost:${env.FRONTEND_PORT}`;
  const frontendReady = await waitForUrl(frontendUrl, 24, 5000);
  if (!frontendReady) {
    console.error(`Frontend URL check failed: ${frontendUrl}`);
    await runCommand('docker', ['compose', 'logs', '--tail', '60', 'frontend'], env);
    process.exit(1);
  }

  console.log('');
  console.log('Project stack is up.');
  console.log(`App:        ${frontendUrl}`);
  console.log(`API:        ${frontendUrl}/api/v1`);
  console.log(`API Docs:   ${frontendUrl}/api/docs`);
  console.log('Grafana:    http://localhost:3000  (admin/admin)');
  console.log('Prometheus: http://localhost:9090');
  console.log('MinIO:      http://localhost:9001');
};

const main = async () => {
  const mode = parseMode();
  const env = {
    ...process.env,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-dev-access-secret',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-dev-refresh-secret',
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
    APP_BASE_URL: process.env.APP_BASE_URL || 'http://localhost',
    APP_BASE_URLS: process.env.APP_BASE_URLS || 'http://localhost,http://localhost:5175',
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:4000',
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || '/api/v1',
    FRONTEND_PORT: process.env.FRONTEND_PORT || '5175'
  };

  if (mode === 'fast') {
    const currentRunEnv = String(env.RUN_ENV || '').toLowerCase();
    if (!currentRunEnv || currentRunEnv === 'local') {
      env.RUN_ENV = 'test';
    }

    // Avoid stale process-level Mongo vars from persistent shells overriding .env edits.
    delete env.MONGODB_URI;
    delete env.MONGODB_URI_STAGING;
    delete env.MONGODB_URI_TEST;
    delete env.MONGODB_URI_PROD;
  }

  Object.assign(env, resolveRuntimeEnv({ baseEnv: env, envFilePath: path.join(rootDir, '.env') }));

  if (mode === 'fast' && env.MONGODB_URI_SOURCE !== 'MONGODB_URI_TEST') {
    throw new Error(
      `Fast dev mode requires cloud test MongoDB. Selected ${env.MONGODB_URI_SOURCE}; set MONGODB_URI_TEST.`
    );
  }

  if (mode === 'fast') {
    await startFastDevStack(env);
    return;
  }

  await startDockerStack(env);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});