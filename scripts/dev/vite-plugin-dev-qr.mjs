import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import qrcode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';

const TUNNEL_URL_FILE = resolve(process.cwd(), '.dev-mobile-tunnel.url');

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
  // Windows Mobile Hotspot (phone joins PC hotspot — works when guest Wi-Fi isolates clients).
  if (host.startsWith('192.168.137.')) return 120;
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

function tunnelFileMobileUrl() {
  const tunnelMode =
    process.env.DEV_TUNNEL === '1' || process.env.DEV_TUNNEL?.toLowerCase() === 'true';
  if (!tunnelMode) return null;
  const rel = process.env.DEV_MOBILE_TUNNEL_FILE?.trim() || '.dev-mobile-tunnel.url';
  const file = resolve(process.cwd(), rel);
  try {
    if (!existsSync(file)) return null;
    const raw = readFileSync(file, 'utf8').trim();
    if (!raw) return null;
    const normalized = raw.endsWith('/') ? raw : `${raw}/`;
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return normalized;
  } catch {
    return null;
  }
}

function collectMobileUrlCandidates(viteUrls, port = 5175) {
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

  return [...candidates.values()].sort((a, b) => b.score - a.score);
}

/** Prefer live Wi‑Fi / LAN IPs; ignore stale Vite network URLs after a network change. */
export function pickBestMobileUrl(viteUrls, port = 5175) {
  return collectMobileUrlCandidates(viteUrls, port)[0] ?? null;
}

export function listMobileUrlCandidates(viteUrls, port = 5175) {
  return collectMobileUrlCandidates(viteUrls, port);
}

function resolveMobileTarget(server) {
  const override = envMobileUrlOverride();
  if (override) {
    return { url: override, source: 'DEV_MOBILE_URL' };
  }
  const tunnel = tunnelFileMobileUrl();
  if (tunnel) {
    return { url: tunnel, source: 'cloudflare-tunnel' };
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
  try {
    const pngBuffer = await qrcode.toBuffer(primary, {
      margin: 4,
      width: 512,
      errorCorrectionLevel: 'M',
    });
    const { writeFile } = await import('node:fs/promises');
    await writeFile(pngPath, pngBuffer);
  } catch (err) {
    console.warn(
      `  ⚠️  Could not write dev-mobile-qr.png (${err instanceof Error ? err.message : err}) — ` +
        'close the file in your editor or use the live QR page below.\n'
    );
  }

  const qrPage = `${primary.replace(/\/$/, '')}${QR_PAGE}`;
  console.log(`\n  📱 Mobile URL (scan this) → ${primary}`);
  console.log(`  📱 QR page (live)         → ${qrPage}`);
  console.log(`  📱 QR page (on laptop)    → http://localhost:${server.config.server.port ?? 5175}${QR_PAGE}`);
  console.log(`  📱 QR image (live)        → ${primary.replace(/\/$/, '')}/__dev/mobile-qr.png`);
  console.log(`     (picked ${target.source})`);
  if (process.platform === 'win32' && !server.__devQrFirewallHintShown) {
    server.__devQrFirewallHintShown = true;
    console.log(
      '  💡 Phone cannot connect? Run: npm run dev:firewall  (allows inbound TCP 5175 on Private networks)\n'
    );
  } else {
    console.log('');
  }

  const staleVite = viteNetworkUrls(server).filter((url) => {
    const host = hostFromUrl(url);
    return host && !liveInterfaceIpv4s().has(host);
  });
  if (staleVite.length > 0) {
    console.log('  Ignoring stale Vite network URLs (restart dev after Wi‑Fi change):');
    for (const url of staleVite) console.log(`    · ${url}`);
    console.log('');
  }

  const scanHint =
    target.source === 'cloudflare-tunnel'
      ? '  Scan with your phone (Wi‑Fi or mobile data):\n'
      : '  Scan with your phone (same Wi‑Fi):\n';
  qrcodeTerminal.generate(primary, { small: true }, (ascii) => {
    console.log(scanHint);
    console.log(ascii);
  });

  return target;
}

function overrideUrlFromRequest(reqUrl) {
  try {
    const query = reqUrl.includes('?') ? reqUrl.slice(reqUrl.indexOf('?') + 1) : '';
    const params = new URLSearchParams(query);
    const raw = params.get('t')?.trim();
    if (!raw || !raw.startsWith('http')) return null;
    const normalized = raw.endsWith('/') ? raw : `${raw}/`;
    new URL(normalized);
    return normalized;
  } catch {
    return null;
  }
}

async function sendQrPng(server, req, res) {
  const override = overrideUrlFromRequest(req.url ?? '');
  const target = override
    ? { url: override, source: 'manual' }
    : await refreshQrArtifacts(server);
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
    const hasLan =
      tunnelFileMobileUrl() || pickBestMobileUrl([], server.config.server.port ?? 5175);
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
        void sendQrPng(server, req, res);
      });

      server.middlewares.use(DEV_URL_PATH, (_req, res) => {
        const port = server.config.server.port ?? 5175;
        const candidates = listMobileUrlCandidates(viteNetworkUrls(server), port);
        void refreshQrArtifacts(server).then((target) => {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(
            JSON.stringify({
              url: target?.url ?? null,
              qrPage: target?.url ? `${target.url.replace(/\/$/, '')}${QR_PAGE}` : null,
              source: target?.source ?? null,
              candidates: candidates.map(({ url, source }) => ({ url, source })),
              localhostQrPage: `http://localhost:${port}${QR_PAGE}`,
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
