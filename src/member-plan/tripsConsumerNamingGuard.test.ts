import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCAN_ROOT = join(process.cwd(), 'src');

const ALLOWLIST = new Set([
  'src/member-plan/tripsConsumerNamingGuard.test.ts',
  'src/member-plan/planHubRouting.ts',
  'src/member-plan/inboundTripsRedirect.ts',
  'src/member-plan/resolvePlanHubView.ts',
  'src/member-plan/participantIntentPlan.ts',
  'src/config/surfacePaths.ts',
  'src/App.tsx',
  'src/utils/notificationRouting.test.ts',
  'src/pages/publishing/Overview.tsx',
  'src/explore/exploreItemSearch.ts',
  'src/explore/explorePinKindFilter.ts',
  'src/list/browseListTaxonomy.ts',
]);

const DEPRECATED_TRIPS_SHIM_PREFIX = 'src/trips/';

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
  it('consumer UI does not use trips hub product copy or link to /profile/my-trips', () => {
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

  it('consumer UI does not link to legacy /trips hub (use /plan)', () => {
    const violations: string[] = [];
    const legacyTripsLink =
      /(?:to|href)=\{?[`"']\/trips(?:[?'"])|(?:to|href)=["']\/trips|navigate\(\s*[`"']\/trips/;

    for (const file of collectSourceFiles(SCAN_ROOT)) {
      if (ALLOWLIST.has(file)) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (legacyTripsLink.test(content)) {
        violations.push(`${file}: use PLAN_PATH / planRouting helpers — not /trips`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('tripsRouting shim is gone (planHubRouting / routingCatalog only)', () => {
    expect(existsSync(join(process.cwd(), 'src/member-plan/tripsRouting.ts'))).toBe(false);
  });

  it('app code does not import deleted member-plan/tripsRouting', () => {
    const violations: string[] = [];
    const deprecatedImport = /from ['"](\.\.\/)+member-plan\/tripsRouting['"]/;

    for (const file of collectSourceFiles(SCAN_ROOT)) {
      if (ALLOWLIST.has(file)) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (deprecatedImport.test(content)) {
        violations.push(`${file}: use planHubRouting or routingCatalog — tripsRouting is removed`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('app code imports src/member-plan (not deprecated src/trips shims)', () => {
    const violations: string[] = [];
    const deprecatedImport = /from ['"](\.\.\/)+trips\/|from ['"]\.\/trips\//;

    for (const file of collectSourceFiles(SCAN_ROOT)) {
      if (file.startsWith(DEPRECATED_TRIPS_SHIM_PREFIX)) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (deprecatedImport.test(content)) {
        violations.push(`${file}: use src/member-plan/* — src/trips is a one-release shim`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('deprecated components/trips shim folder is removed', () => {
    expect(existsSync(join(process.cwd(), 'src/components/trips'))).toBe(false);
  });

  it('legacy Plan lens tab chrome is removed (Upcoming · Wishlist only)', () => {
    expect(existsSync(join(process.cwd(), 'src/components/plan/PlanLensTabs.tsx'))).toBe(false);
  });

  it('app code imports profile-history chrome (not deprecated components/trips)', () => {
    const violations: string[] = [];
    const legacyTripsChromeImport = /from ['"](\.\.\/)+components\/trips\//;

    for (const file of collectSourceFiles(SCAN_ROOT)) {
      if (file.startsWith('src/components/trips/')) continue;
      if (ALLOWLIST.has(file)) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (legacyTripsChromeImport.test(content)) {
        violations.push(`${file}: use src/components/profile-history/* — components/trips is a shim`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('consumer UI imports plan hub helpers via routingCatalog (not planHubRouting)', () => {
    const violations: string[] = [];
    const directImport = /from ['"](\.\.\/)+member-plan\/planHubRouting['"]/;
    const CONSUMER_PREFIXES = ['src/pages/', 'src/components/', 'src/utils/', 'src/hooks/', 'src/content/'];

    for (const file of collectSourceFiles(SCAN_ROOT)) {
      if (!CONSUMER_PREFIXES.some((prefix) => file.startsWith(prefix))) continue;
      if (ALLOWLIST.has(file)) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (directImport.test(content)) {
        violations.push(`${file}: use config/routingCatalog for plan/history URL helpers`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('planHubRouting has no leftover trips* symbol exports', () => {
    const hub = readFileSync(join(process.cwd(), 'src/member-plan/planHubRouting.ts'), 'utf8');
    expect(hub).not.toMatch(/\bexport const trips/);
    expect(hub).not.toMatch(/\bexport type Trips/);
    expect(hub).not.toMatch(/\bnormalizeTripsSearchParams\b/);
  });

  it('profile history map UI lives under components/journey (not components/trips)', () => {
    const violations: string[] = [];
    const legacyJourneyImport =
      /from ['"](\.\.\/)+components\/trips\/(JourneyMap|TripsJourneyMap|journeyMapShare)/;

    for (const file of collectSourceFiles(SCAN_ROOT)) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (legacyJourneyImport.test(content)) {
        violations.push(`${file}: use src/components/journey/* for outdoor history map UI`);
      }
    }

    expect(violations).toEqual([]);
  });
});
