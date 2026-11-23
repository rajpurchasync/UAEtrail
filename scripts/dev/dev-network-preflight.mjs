import os from 'node:os';
import { spawnSync } from 'node:child_process';

const log = (line) => console.log(`[dev:network] ${line}`);

const liveWifiUrl = (port = 5175) => {
  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    if (!/wi-?fi|wlan/i.test(name)) continue;
    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' && entry.family !== 4) continue;
      if (entry.internal) continue;
      return { url: `http://${entry.address}:${port}/`, iface: name };
    }
  }
  return null;
};

const windowsNetworkHints = () => {
  if (process.platform !== 'win32') return;
  const ps = spawnSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      "Get-NetConnectionProfile | Where-Object { $_.IPv4Connectivity -ne 'Disconnected' } | Select-Object -First 1 Name, NetworkCategory | ConvertTo-Json -Compress",
    ],
    { encoding: 'utf8' }
  );
  if (ps.status !== 0 || !ps.stdout?.trim()) return;
  try {
    const profile = JSON.parse(ps.stdout.trim());
    if (profile.NetworkCategory === 0 || profile.NetworkCategory === 'Public') {
      log(
        `Wi-Fi "${profile.Name}" is Public — inbound port 5175 is usually blocked (firewall + guest isolation).`
      );
      log('Fix A: Admin PowerShell → npm run dev:phone-access');
      log('Fix B (reliable): Settings → Mobile hotspot ON → phone joins PC hotspot → use 192.168.137.x URL from terminal');
      log('Fix C (Android USB): npm run dev:phone:adb → open http://localhost:5175 on phone');
    }
    if (/free|guest|hotel|airport|public/i.test(String(profile.Name))) {
      log(
        `Guest-style Wi-Fi ("${profile.Name}") may block device-to-device traffic — phone cannot reach your laptop even with firewall open.`
      );
      log('Use home Wi-Fi, or Windows Mobile Hotspot (laptop hosts, phone joins that hotspot).');
    }
  } catch {
    /* ignore */
  }
};

export const printMobileDevHints = (port = 5175) => {
  const wifi = liveWifiUrl(port);
  if (wifi) {
    log(`Phone URL (same Wi-Fi): ${wifi.url}`);
    log(`QR page on laptop: http://localhost:${port}/mobile-dev-qr.html`);
  }
  windowsNetworkHints();
  log('If the phone spins forever, type the URL manually in Safari/Chrome — QR is the same link.');
};
