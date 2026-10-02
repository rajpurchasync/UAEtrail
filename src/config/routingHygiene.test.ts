import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCAN_ROOT = join(process.cwd(), 'src');

/** Files allowed to contain raw `/explore?` query strings. */
const EXPLORE_QUERY_ALLOWLIST = new Set([
  'src/explore/routing.ts',
  'src/explore/compose.ts',
  'src/explore/exploreCardModel.ts',
  'src/config/platform.ts',
  'src/config/routingCatalog.ts',
  'src/utils/notificationRouting.ts',
  'src/content/homeLanding.ts',
  'src/config/routingHygiene.test.ts',
]);

/** Files allowed to reference `/activities` as a path (legacy redirect / active-state match). */
const ACTIVITIES_PATH_ALLOWLIST = new Set([
  'src/App.tsx',
  'src/constants/index.ts',
  'src/config/platform.ts',
  'src/config/routingCatalog.ts',
  'src/components/layout/MobileBottomNav.tsx',
  'src/config/routingCatalog.ts',
  'src/config/routingHygiene.test.ts',
]);

const collectSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !entry.endsWith('.test.ts')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('routingHygiene', () => {
  it('routingCatalog re-exports entity path and explore helpers', () => {
    const catalog = readFileSync(join(process.cwd(), 'src/config/routingCatalog.ts'), 'utf8');
    expect(catalog).toMatch(/activityDetailPath/);
    expect(catalog).toMatch(/explorePath/);
    expect(catalog).toMatch(/PRO_MEMBERSHIP_PATH/);
    expect(catalog).toMatch(/COMMUNITY_PATH/);
    expect(catalog).toMatch(/PROFILE_BADGES_PATH/);
  });

  it('app code does not use raw /explore? outside explore routing allowlist', () => {
    const files = collectSourceFiles(SCAN_ROOT).filter((file) => !file.startsWith('src/explore/'));
    const violations: string[] = [];

    for (const file of files) {
      if (EXPLORE_QUERY_ALLOWLIST.has(file)) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/(?<![\w])['"`]\/explore\?/.test(content)) {
        violations.push(`${file}: use explorePath() from routingCatalog`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('app code does not link to legacy /activities hub (use TRIPS_PATH)', () => {
    const files = collectSourceFiles(SCAN_ROOT);
    const violations: string[] = [];
    const linkPattern =
      /(?:to|href)=["']\/activities(?:[?'"])|navigate\(\s*["']\/activities|path:\s*["']\/activities["']/;

    for (const file of files) {
      if (ACTIVITIES_PATH_ALLOWLIST.has(file)) continue;
      if (file.includes('/api/')) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (linkPattern.test(content)) {
        violations.push(`${file}: use TRIPS_PATH (/trips) from routingCatalog`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('app code does not introduce /demand/ detail routes', () => {
    const files = collectSourceFiles(SCAN_ROOT);
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/(?:to|href)=["']\/demand\/|navigate\(\s*["']\/demand\//.test(content)) {
        violations.push(`${file}: demand uses explore pin paths, not /demand/:id`);
      }
    }

    expect(violations).toEqual([]);
  });
});
