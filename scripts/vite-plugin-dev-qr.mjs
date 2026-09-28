import os from 'node:os';
import { resolve } from 'node:path';
import qrcode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';

const QR_PAGE = '/mobile-dev-qr.html';
const DEV_URL_PATH = '/__dev/mobile-url.json';
const REFRESH_MS = 15_000;

function viteNetworkUrls(server) {
  return server.resolvedUrls?.network ?? [];
}

function liveInterfaceIpv4s() {
  const ips = new Set();
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' && entry.family !== 4) continue;
      if (entry.internal) continue;
      ips.add(entry.address);
    }
  }
  return ips;
}

function hostFromUrl(url) {
  try {
    return new URL(url.endsWith('/') ? url : `${url}/`).hostname;
  } catch {
    return null;
  }
}

function interfaceScore(name) {
  const n = name.toLowerCase();
  if (n.includes('wi-fi') || n.includes('wifi') || n.includes('wlan')) return 100;
  if (n.includes('ethernet') && !n.includes('virtual') && !n.includes('vethernet')) return 80;
  if (n.includes('wsl') || n.includes('hyper-v') || n.includes('docker') || n.includes('vethernet')) {
    return 10;
  }
  return 50;
}

function hostScore(host, ifaceScore = 0) {
  if (host === 'localhost' || host === '127.0.0.1') return -1;
  if (host.startsWith('192.168.')) return 100;
  if (host.startsWith('10.')) return 90;
  if (host.startsWith('172.')) {
    const second = Number(host.split('.')[1]);
    if (second >= 16 && second <= 31) {
      // 172.16–31 on Wi‑Fi/Ethernet is a real LAN, not WSL/Hyper‑V.
      if (ifaceScore >= 80) return 95;
      return 30;
    }
  }
  return 50;
}

function envMobileUrlOverride() {
  const raw = process.env.DEV_MOBILE_URL?.trim();
  if (!raw) return null;
  const normalized = raw.endsWith('/') ? raw : `${raw}/`;
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return normalized;
  } catch {
    return null;
  }
}

/** Prefer live Wi‑Fi / LAN IPs; ignore stale Vite network URLs after a network change. */
export function pickBestMobileUrl(viteUrls, port = 5175) {
  const candidates = new Map();
  const liveIps = liveInterfaceIpv4s();

  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    const ifaceScore = interfaceScore(name);
    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' && entry.family !== 4) continue;
      if (entry.internal) continue;
      const url = `http://${entry.address}:${port}/`;
      const score = hostScore(entry.address, ifaceScore) + ifaceScore;
      const prev = candidates.get(url);
      if (!prev || score > prev.score) {
        candidates.set(url, { url, score, source: name });
      }
    }
  }

  for (const url of viteUrls) {
    const normalized = url.endsWith('/') ? url : `${url}/`;
    const host = hostFromUrl(normalized);
    if (!host || !liveIps.has(host) || candidates.has(normalized)) continue;
    const score = hostScore(host) + 40;
    candidates.set(normalized, { url: normalized, score, source: 'vite' });
  }

  return [...candidates.values()].sort((a, b) => b.score - a.score)[0] ?? null;
}

function resolveMobileTarget(server) {
  const override = envMobileUrlOverride();
  if (override) {
    return { url: override, source: 'DEV_MOBILE_URL' };
  }
  const port = server.config.server.port ?? 5175;
  const picked = pickBestMobileUrl(viteNetworkUrls(server), port);
  return picked ? { url: picked.url, source: picked.source } : null;
}

async function refreshQrArtifacts(server, { force = false } = {}) {
  const target = resolveMobileTarget(server);
  if (!target?.url) {
    console.log('\n  ⚠️  No reachable LAN URL found — phone cannot use localhost.\n');
    server.__devQrLastUrl = null;
    return null;
  }

  if (!force && server.__devQrLastUrl === target.url) {
    return target;
  }
  server.__devQrLastUrl = target.url;

  const primary = target.url;
  const pngPath = resolve(process.cwd(), 'dev-mobile-qr.png');
  await qrcode.toFile(pngPath, primary, { margin: 4, width: 512, errorCorrectionLevel: 'M' });

  const qrPage = `${primary.replace(/\/$/, '')}${QR_PAGE}`;
  console.log(`\n  📱 Mobile URL (scan this) → ${primary}`);
  console.log(`  📱 QR page (live)         → ${qrPage}`);
  console.log(`  📱 QR image (live)        → ${primary.replace(/\/$/, '')}/__dev/mobile-qr.png`);
  console.log(`  📱 QR image file          → dev-mobile-qr.png`);
  console.log(`     (picked ${target.source})\n`);

  const staleVite = viteNetworkUrls(server).filter((url) => {
    const host = hostFromUrl(url);
    return host && !liveInterfaceIpv4s().has(host);
  });
  if (staleVite.length > 0) {
    console.log('  Ignoring stale Vite network URLs (restart dev after Wi‑Fi change):');
    for (const url of staleVite) console.log(`    · ${url}`);
    console.log('');
  }

  qrcodeTerminal.generate(primary, { small: true }, (ascii) => {
    console.log('  Scan with your phone (same Wi‑Fi):\n');
    console.log(ascii);
  });

  return target;
}

async function sendQrPng(server, res) {
  const target = await refreshQrArtifacts(server);
  if (!target?.url) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end('No LAN URL — start dev with npm run dev and use the Network URL from the terminal.');
    return;
  }
  const buffer = await qrcode.toBuffer(target.url, {
    margin: 4,
    width: 512,
    errorCorrectionLevel: 'M',
  });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store');
  res.end(buffer);
}

function scheduleRefresh(server) {
  const tryRefresh = (attempt = 0) => {
    const hasLan = pickBestMobileUrl([], server.config.server.port ?? 5175);
    if (hasLan || attempt >= 20) {
      void refreshQrArtifacts(server, { force: true });
      return;
    }
    setTimeout(() => tryRefresh(attempt + 1), 50);
  };
  tryRefresh();
}

export function devQrPlugin() {
  return {
    name: 'dev-qr',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__dev/mobile-qr.png', (req, res) => {
        void sendQrPng(server, res);
      });

      server.middlewares.use(DEV_URL_PATH, (_req, res) => {
        void refreshQrArtifacts(server).then((target) => {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(
            JSON.stringify({
              url: target?.url ?? null,
              qrPage: target?.url ? `${target.url.replace(/\/$/, '')}${QR_PAGE}` : null,
              source: target?.source ?? null,
            })
          );
        });
      });

      const onListen = () => {
        scheduleRefresh(server);
        const timer = setInterval(() => {
          void refreshQrArtifacts(server);
        }, REFRESH_MS);
        server.httpServer?.once('close', () => clearInterval(timer));
      };

      if (server.httpServer?.listening) {
        onListen();
      } else {
        server.httpServer?.once('listening', onListen);
      }
    },
  };
}
