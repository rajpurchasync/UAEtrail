import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const manifest = JSON.parse(read('scripts/governance/bounded-context-manifest.json')) as {
  contexts: Array<{ id: string; feRoots?: string[]; apiFiles?: string[] }>;
};

const collectTsFiles = (dir: string): string[] => {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectTsFiles(full));
    } else if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !entry.endsWith('.test.ts')) {
      files.push(relative(ROOT, full).replace(/\\/g, '/'));
    }
  }
  return files;
};

const feRootsFromManifest = (): string[] => {
  const roots = new Set<string>();
  for (const ctx of manifest.contexts) {
    for (const root of ctx.feRoots ?? []) roots.add(root.replace(/\/\*$/, ''));
  }
  return [...roots];
};

describe('productDataLineageGuard (system-wide)', () => {
  it('CTX-DATA-01: guest marketing does not ship fictional activity cards', () => {
    expect(read('src/content/homeLanding.ts')).not.toMatch(/HOME_LANDING_FALLBACK/);
    expect(read('src/hooks/useHomeLandingActivities.ts')).not.toMatch(/fallbackPayload/);
    expect(read('src/hooks/useHomeLandingActivities.ts')).toMatch(/fetchApiActivities/);
  });

  it('CTX-DATA-02: list discovery filters delegate looking + place merge to discovery modules', () => {
    const filters = read('src/list/browse/browseListFilters.ts');
    expect(filters).toMatch(/activity-discovery\/catalog\/listAvailabilityCatalog/);
    expect(filters).toMatch(/places-discovery\/catalog\/listCatalog/);
    expect(filters).not.toMatch(/exploreMapItemIsRetiredSeekingActivity/);
  });

  it('CTX-DATA-03: map catalog assembly never overlays venue JSON at read time', () => {
    const builder = read('apps/api/src/lib/discovery-catalog-builder.ts');
    expect(builder).not.toMatch(/overlayCatalogDefaultsOnLocation/);
    expect(read('apps/api/src/lib/venue-catalog.ts')).toMatch(/not wired on `GET \/explore\/map`/);
  });

  it('CTX-DATA-04: guest explore map HTTP applies server catalog cap', () => {
    const route = read('apps/api/src/lib/explore-map-route.ts');
    expect(route).toMatch(/applyGuestExploreMapCatalogCap/);
    expect(route).toMatch(/isGuestExploreMapCatalogCapEnabled/);
  });

  it('CTX-DATA-05: consumer map/list reads use explore map hook — not parallel static catalogs', () => {
    const violations: string[] = [];
    const seen = new Set<string>();
    for (const root of feRootsFromManifest()) {
      const abs = join(ROOT, root);
      if (!existsSync(abs)) continue;
      for (const file of collectTsFiles(statSync(abs).isDirectory() ? abs : dirname(abs))) {
        if (!file.startsWith('src/list/') && !file.startsWith('src/explore/')) continue;
        if (file.includes('exploreMapItemFixtures')) continue;
        if (seen.has(file)) continue;
        seen.add(file);
        const content = read(file);
        if (/\bconst\s+\w+\s*:\s*ExploreMapItemDTO\[\]\s*=\s*\[(?!\s*\])/.test(content)) {
          violations.push(`${file}: inline ExploreMapItemDTO[] catalog`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('CTX-DATA-07: guest home reviews and outings prefer public API feeds', () => {
    expect(read('src/hooks/useHomeMarketingReviews.ts')).toMatch(/marketing-highlights/);
    expect(read('src/components/home/marketing/sections/HomeReviewsFaqSection.tsx')).toMatch(
      /useHomeMarketingReviews/
    );
    expect(read('src/hooks/useHomeLandingActivities.ts')).toMatch(/getFeaturedActivities/);
  });

  it('CTX-DATA-08: published destinations drive consumer emirate options when rows exist', () => {
    expect(read('src/config/regions.ts')).toMatch(/venueStateOptionsFromPublishedDestinations/);
    expect(read('src/config/regions.ts')).toMatch(/destinations\.length > 0/);
    expect(read('src/config/regions.ts')).toMatch(/consumerEmirateKeys/);
  });

  it('CTX-DATA-09: in-app consumer surfaces delegate inventory to API hooks', () => {
    expect(existsSync(join(ROOT, 'src/config/consumerAppSurfacesDataGuard.test.ts'))).toBe(true);
  });

  it('CTX-DATA-10: activity detail L1 cards project from API DTO — not explore fixtures', () => {
    expect(read('src/activity/detail/buildActivityDetailDiscoveryCard.ts')).toMatch(
      /buildExploreMapItemFromActivity/
    );
    expect(read('src/activity/detail/buildActivityDetailDiscoveryCard.ts')).not.toMatch(
      /exploreMapItemFixtures/
    );
    expect(read('src/activity/detail/activityDetailPageShellCard.ts')).toMatch(
      /buildExploreMapItemFromActivity/
    );
    expect(read('src/activity/detail/activityDetailPageShellCard.ts')).not.toMatch(
      /exploreMapItemFixtures/
    );
  });

  it('CTX-DATA-06: published areas API backs consumer emirate pickers (hooks present)', () => {
    expect(existsSync(join(ROOT, 'src/config/useVenueStateFilterOptions.ts'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/config/useExploreRegionPillOptions.ts'))).toBe(true);
    expect(read('src/explore/search/ExploreSearchPickSheets.tsx')).toMatch(/useExploreRegionPillOptions/);
    expect(read('src/explore/ui/ExploreMapMobileUaePill.tsx')).toMatch(/useVenueStateFilterOptions/);
    expect(read('src/explore/search/exploreSearchWhereSuggestions.ts')).toMatch(/mergeExploreRegionPillOptionsWithDestinations/);
    expect(read('src/explore/search/ExploreSearchResultsChrome.tsx')).toMatch(/useExploreRegionPillOptions/);
    expect(read('src/explore/ui/EmirateFromPinField.tsx')).toMatch(/useVenueStateFilterOptions/);
  });
});