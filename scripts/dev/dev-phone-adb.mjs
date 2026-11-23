/**
 * Android only: USB debugging + adb reverse so the phone opens http://localhost:5175
 * (traffic forwarded to this PC). Enable USB debugging, connect cable, then run:
 *   npm run dev:local   (in one terminal)
 *   npm run dev:phone:adb   (in another)
 */
import { spawnSync } from 'node:child_process';

const port = 5175;

const adb = spawnSync('adb', ['devices'], { encoding: 'utf8' });
if (adb.status !== 0) {
  console.error('[dev:phone:adb] adb not found. Install Android platform-tools or use Mobile Hotspot instead.');
  process.exit(1);
}
if (!/^\S+\tdevice/m.test(adb.stdout || '')) {
  console.error('[dev:phone:adb] No device in "device" state. Enable USB debugging and accept the PC prompt on the phone.');
  console.error(adb.stdout || adb.stderr);
  process.exit(1);
}

const reverse = spawnSync('adb', ['reverse', `tcp:${port}`, `tcp:${port}`], { encoding: 'utf8', stdio: 'inherit' });
if (reverse.status !== 0) process.exit(reverse.status ?? 1);

console.log('\n[dev:phone:adb] On the phone (Chrome), open:');
console.log(`  http://localhost:${port}/`);
console.log('[dev:phone:adb] Keep USB connected while testing.\n');
