/**
 * OPTIONAL — public HTTPS tunnel when LAN QR cannot work (firewall / guest Wi‑Fi).
 * Normal phone testing: use `npm run dev:local` and scan the Wi‑Fi URL from the terminal.
 */
import { spawn } from 'node:child_process';
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import qrcode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const tunnelUrlFile = path.join(rootDir, '.dev-mobile-tunnel.url');
const vitePort = Number(process.env.FRONTEND_PORT || 5175);
const localMongoUri =
  process.env.LOCAL_MONGODB_URI?.trim() || 'mongodb://127.0.0.1:27017/uaetrail_dev';

dotenv.config({ path: path.join(rootDir, '.env') });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const dockerComposeEnv = () => ({
  ...process.env,
  MONGODB_URI: localMongoUri,
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID?.trim() || 'local-dev',
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY?.trim() || 'local-dev-secret',
});

const spawnLogged = (command, args, options = {}) => {
  const child = spawn(command, args, {
    cwd: rootDir,
    shell: process.platform === 'win32',
    ...options,
  });
  return child;
};

const startLocalMongo = async () => {
  console.log('[dev:mobile] Starting local MongoDB (Docker)…');
  try {
    spawnLogged('docker', ['start', 'uaetrail-mongo-1'], { stdio: 'ignore' });
  } catch {
    /* optional */
  }
  try {
    await new Promise((resolve, reject) => {
      const child = spawnLogged(
        'docker',
        ['compose', '--profile', 'local-mongo', 'up', '-d', 'mongo'],
        { env: dockerComposeEnv(), stdio: 'inherit' }
      );
      child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`mongo exit ${code}`))));
    });
  } catch (error) {
    console.warn(
      `[dev:mobile] Mongo via Docker failed (${error instanceof Error ? error.message : error}). ` +
        'Start Docker Desktop or fix LOCAL_MONGODB_URI.\n'
    );
  }
};

const waitForVite = async () => {
  for (let attempt = 1; attempt <= 120; attempt += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${vitePort}/`, { redirect: 'manual' });
      if (res.ok || res.status === 304 || res.status === 404) return true;
    } catch {
      /* retry */
    }
    if (attempt % 10 === 0) {
      console.log(`[dev:mobile] Waiting for Vite on :${vitePort}… (${attempt}/120)`);
    }
    await sleep(1000);
  }
  return false;
};

const TUNNEL_URL_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;

const announceTunnel = async (url) => {
  const normalized = url.endsWith('/') ? url : `${url}/`;
  writeFileSync(tunnelUrlFile, normalized, 'utf8');
  console.log('\n[dev:mobile] ═══════════════════════════════════════════════════');
  console.log(`[dev:mobile] Phone URL (scan QR or tap): ${normalized}`);
  console.log('[dev:mobile] Works on Wi‑Fi or mobile data — no firewall setup needed.');
  console.log('[dev:mobile] ═══════════════════════════════════════════════════\n');
  qrcodeTerminal.generate(normalized, { small: true }, (ascii) => {
    console.log(ascii);
    console.log('');
  });
  try {
    await qrcode.toFile(path.join(rootDir, 'dev-mobile-qr.png'), normalized, {
      margin: 4,
      width: 512,
      errorCorrectionLevel: 'M',
    });
  } catch {
    /* locked file in editor */
  }
};

const startCloudflared = () =>
  new Promise((resolve, reject) => {
    console.log('[dev:mobile] Starting Cloudflare quick tunnel (first run may download cloudflared)…');
    const child = spawnLogged(
      'npx',
      [
        '--yes',
        'cloudflared',
        'tunnel',
        '--protocol',
        'http2',
        '--url',
        `http://127.0.0.1:${vitePort}`,
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );

    let settled = false;
    const onLine = (chunk) => {
      const text = chunk.toString();
      process.stdout.write(text);
      const match = text.match(TUNNEL_URL_RE);
      if (match && !settled) {
        settled = true;
        void announceTunnel(match[0]).then(() => resolve(child));
      }
    };

    child.stdout?.on('data', onLine);
    child.stderr?.on('data', onLine);
    child.on('error', reject);
    child.on('exit', (code) => {
      if (!settled) reject(new Error(`cloudflared exited with code ${code ?? 1}`));
    });

    setTimeout(() => {
      if (!settled) {
        reject(new Error('Timed out waiting for tunnel URL (60s). Check network / try again.'));
        child.kill();
      }
    }, 60_000);
  });

const cleanup = () => {
  try {
    if (existsSync(tunnelUrlFile)) unlinkSync(tunnelUrlFile);
  } catch {
    /* ignore */
  }
};

const main = async () => {
  cleanup();
  await startLocalMongo();

  const devEnv = {
    ...process.env,
    MONGODB_URI: localMongoUri,
    RUN_ENV: process.env.RUN_ENV ?? 'test',
    DEV_TUNNEL: '1',
    DEV_MOBILE_TUNNEL_FILE: '.dev-mobile-tunnel.url',
  };

  console.log(`[dev:mobile] Starting Vite + API (port ${vitePort})…`);
  const devChild = spawnLogged('npm', ['run', 'dev:all'], {
    env: devEnv,
    stdio: 'inherit',
  });

  const ready = await waitForVite();
  if (!ready) {
    console.error(`[dev:mobile] Vite did not start on :${vitePort}. Stop other dev servers and retry.`);
    devChild.kill();
    process.exit(1);
  }

  let tunnelChild;
  try {
    tunnelChild = await startCloudflared();
  } catch (error) {
    console.error('[dev:mobile] Tunnel failed:', error instanceof Error ? error.message : error);
    devChild.kill();
    cleanup();
    process.exit(1);
  }

  const shutdown = () => {
    cleanup();
    tunnelChild?.kill();
    devChild.kill();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  devChild.on('exit', (code) => {
    tunnelChild?.kill();
    cleanup();
    process.exit(code ?? 0);
  });
};

main().catch((error) => {
  console.error('[dev:mobile] Failed:', error instanceof Error ? error.message : error);
  cleanup();
  process.exit(1);
});
