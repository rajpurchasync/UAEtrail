import os from 'node:os';
import { resolve } from 'node:path';
import qrcode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';

const QR_PAGE = '/mobile-dev-qr.html';
const DEV_URL_PATH = '/__dev/mobile-url.json';

function viteNetworkUrls(server) {
  return server.resolvedUrls?.network ?? [];
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

function hostScore(host) {
  if (host === 'localhost' || host === '127.0.0.1') return -1;
  if (host.startsWith('192.168.')) return 100;
  if (host.startsWith('10.')) return 90;
  if (host.startsWith('172.')) {
    const second = Number(host.split('.')[1]);
    if (second >= 16 && second <= 31) return 30;
  }
  return 50;
}

/** Prefer Wi‑Fi / LAN IPs over WSL, Hyper‑V, or VPN adapters. */
export function pickBestMobileUrl(viteUrls, port = 5175) {
  const candidates = new Map();

  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    const ifaceScore = interfaceScore(name);
    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' && entry.family !== 4) continue;
      if (entry.internal) continue;
      const url = `http://${entry.address}:${port}/`;
      const score = hostScore(entry.address) + ifaceScore;
      const prev = candidates.get(url);
      if (!prev || score > prev.score) {
        candidates.set(url, { url, score, source: name });
      }
    }
  }

  for (const url of viteUrls) {
    const normalized = url.endsWith('/') ? url : `${url}/`;
    let host = '';
    try {
      host = new URL(normalized).hostname;
    } catch {
      continue;
    }
    const score = hostScore(host) + 40;
    const prev = candidates.get(normalized);
    if (!prev || score > prev.score) {
      candidates.set(normalized, { url: normalized, score, source: 'vite' });
    }
  }

  return [...candidates.values()].sort((a, b) => b.score - a.score)[0] ?? null;
}

async function refreshQrArtifacts(server) {
  const port = server.config.server.port ?? 5175;
  const picked = pickBestMobileUrl(viteNetworkUrls(server), port);

  if (!picked) {
    console.log('\n  ⚠️  No reachable LAN URL found — phone cannot use localhost.\n');
    return;
  }

  const primary = picked.url;
  const pngPath = resolve(process.cwd(), 'dev-mobile-qr.png');
  await qrcode.toFile(pngPath, primary, { margin: 4, width: 512 });

  const qrPage = `${primary.replace(/\/$/, '')}${QR_PAGE}`;
  console.log(`\n  📱 Mobile URL (scan this) → ${primary}`);
  console.log(`  📱 QR page (live)         → ${qrPage}`);
  console.log(`  📱 QR image file          → dev-mobile-qr.png`);
  console.log(`     (picked ${picked.source})\n`);

  const others = [...new Set([...viteNetworkUrls(server), primary])].filter((u) => {
    const norm = u.endsWith('/') ? u : `${u}/`;
    return norm !== primary;
  });
  if (others.length > 0) {
    console.log('  Other network URLs from Vite (may not work on phone):');
    for (const url of others) console.log(`    · ${url}`);
    console.log('');
  }

  qrcodeTerminal.generate(primary, { small: true }, (ascii) => {
    console.log('  Scan with your phone (same Wi‑Fi):\n');
    console.log(ascii);
  });
}

function scheduleRefresh(server) {
  const tryRefresh = (attempt = 0) => {
    const hasViteUrls = viteNetworkUrls(server).length > 0;
    const hasLan = pickBestMobileUrl([], server.config.server.port ?? 5175);
    if (hasViteUrls || hasLan || attempt >= 20) {
      void refreshQrArtifacts(server);
      return;
    }
    setTimeout(() => tryRefresh(attempt + 1), 50);
  };
  tryRefresh();
}

export function devQrPlugin() {
  let latestMobileUrl = null;

  return {
    name: 'dev-qr',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(DEV_URL_PATH, (_req, res) => {
        const port = server.config.server.port ?? 5175;
        const picked = pickBestMobileUrl(viteNetworkUrls(server), port);
        latestMobileUrl = picked?.url ?? null;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(
          JSON.stringify({
            url: latestMobileUrl,
            qrPage: latestMobileUrl ? `${latestMobileUrl.replace(/\/$/, '')}${QR_PAGE}` : null,
            source: picked?.source ?? null,
          })
        );
      });

      const onListen = () => scheduleRefresh(server);

      if (server.httpServer?.listening) {
        onListen();
      } else {
        server.httpServer?.once('listening', onListen);
      }
    },
  };
}
