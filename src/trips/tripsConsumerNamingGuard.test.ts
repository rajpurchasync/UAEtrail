import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCAN_ROOT = join(process.cwd(), 'src');

const ALLOWLIST = new Set([
  'src/trips/tripsConsumerNamingGuard.test.ts',
  'src/config/surfacePaths.ts',
  'src/App.tsx',
  'src/trips/legacyTripsRedirect.ts',
  'src/utils/notificationRouting.test.ts',
  'src/pages/host/Overview.tsx',
]);

const collectSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !entry.endsWith('.d.ts')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('tripsConsumerNamingGuard', () => {
  it('consumer UI does not use “My trips” hub copy or link to /profile/my-trips', () => {
    const violations: string[] = [];
    const myTripsCopy = /My trips/;
    const legacyHistoryLink =
      /(?:to|href)=\{?[`"']\/profile\/my-trips|(?:to|href)=["']\/profile\/my-trips|navigate\(\s*[`"']\/profile\/my-trips/;

    for (const file of collectSourceFiles(SCAN_ROOT)) {
      if (ALLOWLIST.has(file)) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (myTripsCopy.test(content)) {
        violations.push(`${file}: use Plan / History — not “My trips” hub label`);
      }
      if (legacyHistoryLink.test(content)) {
        violations.push(`${file}: use PROFILE_HISTORY_PATH from routingCatalog`);
      }
    }

    expect(violations).toEqual([]);
  });
});
