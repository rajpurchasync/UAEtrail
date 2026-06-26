/**
 * Generate PWA + store PNG icons from public/icons/*.svg
 * Run: npm run icons:generate
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const sources = {
  any: readFileSync(join(root, 'public/icons/icon.svg')),
  maskable: readFileSync(join(root, 'public/icons/maskable.svg'))
};

const ensureDir = (filePath) => mkdirSync(dirname(filePath), { recursive: true });

const writePng = async (outputPath, input, size) => {
  const abs = join(root, outputPath);
  ensureDir(abs);
  await sharp(input).resize(size, size).png().toFile(abs);
  console.log(`  ✓ ${outputPath} (${size}px)`);
};

const pwaOutputs = [
  { path: 'public/icons/icon-192.png', size: 192, src: 'any' },
  { path: 'public/icons/icon-512.png', size: 512, src: 'any' },
  { path: 'public/icons/apple-touch-icon.png', size: 180, src: 'any' },
  { path: 'public/icons/icon-1024.png', size: 1024, src: 'any' },
  { path: 'public/icons/maskable-192.png', size: 192, src: 'maskable' },
  { path: 'public/icons/maskable-512.png', size: 512, src: 'maskable' },
  { path: 'resources/icon.png', size: 1024, src: 'any' }
];

const androidMipmaps = {
  'android/app/src/main/res/mipmap-mdpi/ic_launcher.png': 48,
  'android/app/src/main/res/mipmap-hdpi/ic_launcher.png': 72,
  'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png': 96,
  'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png': 144,
  'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png': 192,
  'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png': 48,
  'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png': 72,
  'android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png': 96,
  'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png': 144,
  'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png': 192,
  'android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png': 108,
  'android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png': 162,
  'android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png': 216,
  'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png': 324,
  'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png': 432
};

console.log('Generating PWA / store icons…');
for (const item of pwaOutputs) {
  await writePng(item.path, sources[item.src], item.size);
}

console.log('Updating Android launcher icons…');
for (const [path, size] of Object.entries(androidMipmaps)) {
  await writePng(path, sources.any, size);
}

console.log('Done.');
