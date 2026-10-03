/**
 * Mobile guest hero: logo row and headline must share the same left gutter (≤2px).
 * Run: npm run build && npx vite preview --port 4173
 *      node scripts/verify-hero-gutter.mjs
 */
import { chromium } from 'playwright';

const base = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(`${base}/`, { waitUntil: 'networkidle' });

const logoIcon = page.locator('.home-launch-brand a[href="/"] .rounded-lg').first();
const headline = page.locator('.home-launch-message h1');
const proofShell = page.locator('.home-landing-scroll .landing-shell-gutter').first();

const [logoBox, headBox, proofBox] = await Promise.all([
  logoIcon.boundingBox(),
  headline.boundingBox(),
  proofShell.boundingBox(),
]);

await browser.close();

if (!logoBox || !headBox || !proofBox) {
  console.error('Missing hero elements — are you signed out on / ?');
  process.exit(1);
}

const headDelta = Math.abs(headBox.x - logoBox.x);
const proofDelta = Math.abs(proofBox.x - logoBox.x);

console.log(`logo left: ${logoBox.x.toFixed(2)}px`);
console.log(`headline left: ${headBox.x.toFixed(2)}px (Δ ${headDelta.toFixed(2)}px)`);
console.log(`proof strip left: ${proofBox.x.toFixed(2)}px (Δ ${proofDelta.toFixed(2)}px)`);

const ok = headDelta <= 2 && proofDelta <= 2;
if (!ok) {
  console.error('FAIL: gutter misalignment');
  process.exit(1);
}
console.log('OK: hero headline and proof strip align with logo gutter');
