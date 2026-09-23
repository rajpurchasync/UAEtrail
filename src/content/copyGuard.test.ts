import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCAN_ROOTS = [
  join(process.cwd(), 'src/pages'),
  join(process.cwd(), 'src/components/home'),
  join(process.cwd(), 'src/components/profile'),
  join(process.cwd(), 'src/explore/ui'),
];

/** Guest-facing CTAs that must come from productNorthStar / homeLanding — not ad-hoc in pages. */
const BANNED_LITERALS: Array<{ pattern: RegExp; hint: string }> = [
  { pattern: /Browse map/i, hint: 'Use PRODUCT_EXPLORE_CTA from productNorthStar.ts' },
  { pattern: /Open Map/i, hint: 'Use HOME_HERO_PRIMARY_CTA or PRODUCT_EXPLORE_CTA' },
  { pattern: /Explore the map/, hint: 'Use PRODUCT_EXPLORE_CTA from productNorthStar.ts' },
  { pattern: /(?<![\w-])Join free(?![\w-])/, hint: 'Use PRODUCT_JOIN_CTA from productNorthStar.ts' },
];

const ALLOWLIST = new Set([
  'src/pages/Home.tsx',
  'src/components/home/HomeDesktopHero.tsx',
  'src/components/home/HomeMobileLaunch.tsx',
  'src/components/home/HomeMarketingClose.tsx',
  'src/content/productNorthStar.ts',
]);

const collectTsxFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectTsxFiles(full));
    } else if (entry.endsWith('.tsx')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('copyGuard', () => {
  it('consumer surfaces do not hardcode canonical explore/join CTAs', () => {
    const files = SCAN_ROOTS.flatMap(collectTsxFiles);
    const violations: string[] = [];

    for (const file of files) {
      if (ALLOWLIST.has(file)) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      for (const { pattern, hint } of BANNED_LITERALS) {
        if (pattern.test(content)) {
          violations.push(`${file}: ${hint}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
