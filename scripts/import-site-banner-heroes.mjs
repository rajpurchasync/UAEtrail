/**
 * One-off: optimize guest marketing hero slides from Desktop\temp\siteBanner.
 * Run: node scripts/import-site-banner-heroes.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = process.env.SITE_BANNER_SRC ?? 'C:/Users/husna/Desktop/temp/siteBanner';
const outDir = join(root, 'public/landing/hero');
mkdirSync(outDir, { recursive: true });

const slides = [
  { key: 'al-rabi', desktop: 'desktop_al_rabi.jpg', mobile: 'mobile_al_rabi.jpg' },
  { key: 'arar', desktop: 'desktop_arar.jpg', mobile: 'mobile_arar.jpg' },
  { key: 'fossil-rock', desktop: 'desktop_Fossil.jpg', mobile: 'mobile_fossil.jpg' },
  { key: 'saliyat-al-baqal', desktop: 'desktop_saliyat_al_baqal.jpg', mobile: 'mobile_saliyat_al_baqal.jpg' }
];

for (const slide of slides) {
  for (const [variant, file, width] of [
    ['desktop', slide.desktop, 1920],
    ['mobile', slide.mobile, 1080]
  ]) {
    const input = join(src, file);
    const base = join(outDir, `hero-${slide.key}-${variant}`);
    const pipeline = sharp(input).rotate().resize(width, null, { withoutEnlargement: true });
    await pipeline.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(`${base}.jpg`);
    await pipeline.clone().webp({ quality: 80 }).toFile(`${base}.webp`);
    console.log(`  ✓ hero-${slide.key}-${variant}`);
  }
}

console.log('Done.');
