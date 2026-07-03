import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import qrcode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';

const QR_PAGE = '/mobile-dev-qr.html';

function networkUrls(server) {
  return server.resolvedUrls?.network ?? [];
}

async function refreshQrArtifacts(urls) {
  const primary = urls[0];
  if (!primary) {
    console.log('\n  ⚠️  No network URL found — phone cannot reach localhost.\n');
    return;
  }

  const pngPath = resolve(process.cwd(), 'dev-mobile-qr.png');
  await qrcode.toFile(pngPath, primary, { margin: 2, width: 512 });

  const qrPage = `${primary.replace(/\/$/, '')}${QR_PAGE}`;
  console.log(`\n  📱 Mobile QR (live) → ${qrPage}`);
  console.log(`  📱 QR image file    → dev-mobile-qr.png\n`);

  qrcodeTerminal.generate(primary, { small: true }, (ascii) => {
    console.log('  Scan with your phone (same Wi‑Fi):\n');
    console.log(ascii);
  });
}

function scheduleRefresh(server) {
  const tryRefresh = (attempt = 0) => {
    const urls = networkUrls(server);
    if (urls.length > 0 || attempt >= 20) {
      void refreshQrArtifacts(urls);
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
      const onListen = () => scheduleRefresh(server);

      if (server.httpServer?.listening) {
        onListen();
      } else {
        server.httpServer?.once('listening', onListen);
      }
    },
  };
}
