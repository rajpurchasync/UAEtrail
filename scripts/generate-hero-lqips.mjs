/**
 * Tiny LQIP WebPs for guest hero progressive loading.
 * Run: node scripts/generate-hero-lqips.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const heroDir = join(root, 'public/landing/hero');
mkdirSync(heroDir, { recursive: true });

const LQIP_WIDTH = 48;

const writeLqip = async (inputPath, outputPath) => {
  await sharp(inputPath)
    .rotate()
    .resize(LQIP_WIDTH, null, { withoutEnlargement: true })
    .blur(6)
    .webp({ quality: 42 })
    .toFile(outputPath);
};

const layoutKeys = ['al-rabi', 'arar', 'fossil-rock', 'saliyat-al-baqal'];

for (const key of layoutKeys) {
  const input = join(heroDir, `hero-${key}-mobile.jpg`);
  const output = join(heroDir, `hero-${key}-lqip.webp`);
  await writeLqip(input, output);
  console.log(`  ✓ hero-${key}-lqip.webp`);
}

const summitIn = join(
  root,
  'public/traveler-hiking-mountains-while-having-his-essentials-backpack-optimized.jpg'
);
const summitOut = join(heroDir, 'hero-summit-hiker-lqip.webp');
await writeLqip(summitIn, summitOut);
console.log('  ✓ hero-summit-hiker-lqip.webp');
console.log('Done.');
