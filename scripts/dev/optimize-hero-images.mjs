/**
 * Re-compress guest hero assets in public/landing/hero (run after banner imports).
 * Run: npm run heroes:optimize
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const heroDir = join(__dirname, '..', 'public/landing/hero');

const variantWidth = (name) => {
  if (name.includes('-desktop.')) return 1600;
  if (name.includes('-mobile.')) return 960;
  return null;
};

const files = readdirSync(heroDir).filter((f) => /\.(jpe?g|webp)$/i.test(f) && !f.includes('-lqip'));

for (const file of files) {
  const width = variantWidth(file);
  if (!width) continue;

  const path = join(heroDir, file);
  const pipeline = sharp(readFileSync(path)).rotate().resize(width, null, { withoutEnlargement: true });

  const out = file.endsWith('.webp')
    ? await pipeline.webp({ quality: 74, effort: 4 }).toBuffer()
    : await pipeline.jpeg({ quality: 78, mozjpeg: true }).toBuffer();

  try {
    // In-place write — Windows often blocks unlink/rename while OneDrive/AV holds the file.
    writeFileSync(path, out);
    console.log(`  ✓ ${file} (≤${width}px)`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`  ⚠ skip ${file}: ${message}`);
  }
}

console.log('Done.');
