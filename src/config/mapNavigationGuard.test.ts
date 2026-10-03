import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

/** Files allowed to contain third-party map URL literals or low-level builders. */
const MAP_URL_LITERAL_ALLOWLIST = new Set([
  'src/utils/mapLinks.ts',
  'src/utils/mapLinks.test.ts',
  'src/utils/googleMapsUrl.ts',
  'src/components/ui/MapPinPicker.tsx',
  'src/components/ui/ActivityPlacePinField.tsx',
  'src/config/mapNavigationGuard.test.ts',
]);

const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /google\.com\/maps/i, label: 'google.com/maps URL literal' },
  { pattern: /waze\.com/i, label: 'waze.com URL literal' },
  { pattern: /maps\.apple\.com/i, label: 'maps.apple.com URL literal' },
];

const collectSourceFiles = (dir: string, acc: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full).replace(/\\/g, '/');
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === 'api') continue;
      collectSourceFiles(full, acc);
    } else if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !entry.endsWith('.test.ts')) {
      acc.push(rel);
    }
  }
  return acc;
};

describe('mapNavigationGuard', () => {
  it('external map URLs live only in mapLinks (or embed/parser allowlist)', () => {
    const violations: string[] = [];
    for (const file of collectSourceFiles(SRC)) {
      if (MAP_URL_LITERAL_ALLOWLIST.has(file)) continue;
      const content = readFileSync(join(ROOT, file), 'utf8');
      for (const { pattern, label } of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          violations.push(`${file}: ${label} — use DirectionsControl / ViewOnMapLink / mapLinks`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('drive URL builders are not imported outside map navigation modules', () => {
    const violations: string[] = [];
    const driveImport =
      /import\s*\{[^}]*\b(buildGoogleDriveUrl|buildWazeDriveUrl)\b[^}]*\}\s*from\s*['"][^'"]*mapLinks/;
    const allowedImporters = new Set([
      'src/components/ui/DirectionsControl.tsx',
      'src/utils/mapLinks.ts',
    ]);
    for (const file of collectSourceFiles(SRC)) {
      if (allowedImporters.has(file)) continue;
      const content = readFileSync(join(ROOT, file), 'utf8');
      if (driveImport.test(content)) {
        violations.push(`${file}: import drive builders via DirectionsControl only`);
      }
    }
    expect(violations).toEqual([]);
  });
});
