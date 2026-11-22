import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** Product surfaces that must not depend on deprecated `/explore/hub` pool helpers. */
const HUB_IMPORT_FORBIDDEN = [
  'src/list/ListDiscoveryExperience.tsx',
  'src/explore/search/ExploreSearchResults.tsx',
  'src/explore/shell/ExploreMapShell.tsx',
  'src/list/BrowseListPage.tsx',
];

const LIST_MODULE_ROOTS = ['src/list/', 'src/discovery/', 'src/activity-discovery/'];

const RETIRED_LIST_BROWSE_SHIMS = [
  'src/list/explorer/DiscoveryBrowsePosterBanner.tsx',
  'src/list/explorer/DiscoveryPosterOverlayNav.tsx',
  'src/list/explorer/ListExplorerItemLink.tsx',
  'src/list/explorer/ListExplorerListingJoinFooter.tsx',
  'src/list/explorer/ListExplorerActivityStatusChips.tsx',
  'src/list/explorer/listExplorerCardMeta.ts',
  'src/list/explorer/listExplorerListingChrome.tsx',
  'src/list/explorer/placeDistance.ts',
  'src/list/browse/BrowseCardJoinFooter.tsx',
  'src/list/listTripPosterPresentation.ts',
  'src/list/listVenuePosterPresentation.ts',
  'src/list/explorer/listExplorerSort.ts',
  'src/list/explorer/listExplorerSort.test.ts',
  'src/list/explorer/listExplorerLayout.ts',
  'src/list/explorer/listExplorerLayout.test.ts',
  'src/list/explorer/listExplorerFabSnap.ts',
  'src/list/explorer/listExplorerBucket.ts',
  'src/list/explorer/listExplorerDateSections.ts',
  'src/list/explorer/listExplorerDateSections.test.ts',
  'src/list/browseListMapHandoff.ts',
  'src/list/browseListMapHandoff.test.ts',
  'src/list/browseCollapsedRailLabels.ts',
  'src/list/listDiscoverySearchCommit.ts',
  'src/list/listDiscoverySearchCommit.test.ts',
  'src/list/browseAudienceFilter.ts',
  'src/list/browseAudienceFilter.test.ts',
  'src/list/browseGeoPath.ts',
  'src/list/browseGeoPath.test.ts',
  'src/list/browseListTripTopics.ts',
  'src/list/browseListTripTopics.test.ts',
  'src/list/browsePosterCover.ts',
  'src/list/browsePosterCover.test.ts',
];

const collectTsUnder = (dir: string): string[] => {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules') continue;
      out.push(...collectTsUnder(full));
    } else if (
      (entry.endsWith('.ts') || entry.endsWith('.tsx')) &&
      !entry.endsWith('.test.ts') &&
      !entry.endsWith('.test.tsx')
    ) {
      out.push(relative(ROOT, full).replace(/\\/g, '/'));
    }
  }
  return out;
};

describe('shimInventoryGuard (repo-wide coherence)', () => {
  it('SHIM-INV-01: list/discovery modules do not import explore/hub join pools', () => {
    const violations: string[] = [];
    const files = collectTsUnder(join(ROOT, 'src/list')).concat(
      collectTsUnder(join(ROOT, 'src/discovery'))
    );
    for (const file of files) {
      if (file.includes('/explore/hub/')) continue;
      const content = read(file);
      if (/from ['"].*explore\/hub\/exploreHubJoinableTrips/.test(content)) {
        violations.push(file);
      }
    }
    expect(violations).toEqual([]);
  });

  it('SHIM-INV-02: canonical list + search surfaces use exploreSearchJoinablePools', () => {
    expect(read('src/list/ListDiscoveryExperience.tsx')).toMatch(/exploreSearchJoinablePools/);
    expect(read('src/list/ListDiscoveryExperience.tsx')).not.toMatch(/explore\/hub\/exploreHubJoinableTrips/);
    expect(read('src/explore/search/ExploreSearchResults.tsx')).toMatch(/exploreSearchJoinablePools/);
    expect(read('src/explore/search/ExploreSearchResults.tsx')).not.toMatch(/hub\/exploreHubJoinableTrips/);
  });

  it('SHIM-INV-03: joinable trip pools live in exploreSearchJoinablePools only', () => {
    const joinModule = read('src/explore/search/exploreSearchJoinablePools.ts');
    expect(joinModule).toMatch(/resolveExploreSearchJoinableTripCards/);
    expect(joinModule).not.toMatch(/exploreHubJoinableTrips/);
    expect(existsSync(join(ROOT, 'src/explore/hub'))).toBe(false);
  });

  it('SHIM-INV-04: retired list browse shims stay deleted (canonical browse + discovery only)', () => {
    const revived: string[] = [];
    for (const file of RETIRED_LIST_BROWSE_SHIMS) {
      if (existsSync(join(ROOT, file))) revived.push(file);
    }
    expect(revived).toEqual([]);
  });

  it('SHIM-INV-05: search subtree does not import exploreHubRouting', () => {
    const searchFiles = collectTsUnder(join(ROOT, 'src/explore/search'));
    const violations: string[] = [];
    for (const file of searchFiles) {
      const content = read(file);
      if (/from ['"].*exploreHubRouting['"]/.test(content)) {
        violations.push(file);
      }
    }
    expect(violations).toEqual([]);
  });

  it('SHIM-INV-06: hot-path surfaces avoid hub pool imports', () => {
    const violations: string[] = [];
    for (const file of HUB_IMPORT_FORBIDDEN) {
      const content = read(file);
      if (/exploreHubJoinableTrips/.test(content)) violations.push(file);
    }
    expect(violations).toEqual([]);
  });

  it('SHIM-INV-07: explore + place surfaces import browse sort/distance, not explorer', () => {
    const scanRoots = ['src/explore', 'src/place'];
    const violations: string[] = [];
    for (const root of scanRoots) {
      for (const file of collectTsUnder(join(ROOT, root))) {
        const content = read(file);
        if (
          /list\/explorer\/listExplorerSort/.test(content) ||
          /list\/explorer\/listExplorer(Layout|Bucket|DateSections|FabSnap)/.test(content)
        ) {
          violations.push(`${file}: retired list explorer browse module (use src/list/browse/)`);
        }
        if (/list\/explorer\/placeDistance/.test(content)) {
          violations.push(`${file}: placeDistance`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('SHIM-INV-09: explore search subtree does not import ../hub (legacy explore hub)', () => {
    const violations: string[] = [];
    for (const file of collectTsUnder(join(ROOT, 'src/explore/search'))) {
      const content = read(file);
      if (/from ['"].*\.\.\/hub\//.test(content)) {
        violations.push(file);
      }
    }
    expect(violations).toEqual([]);
  });

  it('SHIM-INV-08: joinable pool modules use listBrowseSort facade', () => {
    const usesBrowseSort = (rel: string) => {
      const content = read(rel);
      return (
        /list\/browse\/listBrowseSort/.test(content) || /from ['"].*browse\/listBrowseSort['"]/.test(content)
      );
    };
    expect(usesBrowseSort('src/explore/search/exploreSearchJoinablePools.ts')).toBe(true);
    expect(usesBrowseSort('src/list/ListDiscoveryExperience.tsx')).toBe(true);
    expect(read('src/list/browse/listBrowseSort.ts')).toMatch(/export const sortBrowseListCards/);
  });

  it('SHIM-INV-10: list subtree (except explorer shell) does not import retired explorer browse modules', () => {
    const violations: string[] = [];
    const pattern =
      /from ['"][^'"]*list\/explorer\/(listExplorerSort|listExplorerLayout|listExplorerBucket|listExplorerDateSections|listExplorerFabSnap)/;
    for (const file of collectTsUnder(join(ROOT, 'src/list'))) {
      if (file.startsWith('src/list/explorer/')) continue;
      if (pattern.test(read(file))) violations.push(file);
    }
    expect(violations).toEqual([]);
  });
});