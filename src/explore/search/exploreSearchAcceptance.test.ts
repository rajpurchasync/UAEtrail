import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  EXPLORE_SEARCH_RESULTS_PATH,
  exploreSearchListPathFromMapSearch,
  exploreSearchMapViewPathFromListSearch,
  exploreSearchResultsPath,
  exploreInboundHubRedirectTarget,
} from './exploreSearchRouting';
import { resolveMobileBottomTab } from '../../config/mobileFiveTabNav';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('explore search results', () => {
  it('registers /explore/search ahead of /explore catch-all', () => {
    const routes = read('src/routing/AppRoutes.tsx');
    const searchIndex = routes.indexOf('path={EXPLORE_SEARCH_RESULTS_PATH}');
    const exploreIndex = routes.indexOf('path="/explore"');
    expect(searchIndex).toBeGreaterThan(-1);
    expect(routes).toMatch(/ExploreSearchResultsPage/);
    expect(exploreIndex).toBeGreaterThan(searchIndex);
  });

  it('explore search modules are self-contained (no explore/hub code island)', () => {
    const canonicalSources = [
      'src/explore/search/exploreSearchLastSearch.ts',
      'src/explore/search/ExploreSearchScopePills.tsx',
      'src/explore/search/ExploreSearchBookingHero.tsx',
      'src/explore/search/exploreSearchUpcomingTrips.ts',
    ];
    for (const file of canonicalSources) {
      const source = read(file);
      expect(source).not.toMatch(/from ['"]\.\.\/hub\//);
      expect(source).not.toMatch(/ExploreHub/);
      expect(source).not.toMatch(/EXPLORE_HUB_/);
    }
    expect(read('src/config/exploreHubRetirementGuard.test.ts')).toMatch(/HUB-RET-01/);
  });

  it('redirects legacy /explore/hub bookmarks', () => {
    expect(exploreInboundHubRedirectTarget('/explore/hub/search', '?q=camp')).toBe(
      `${EXPLORE_SEARCH_RESULTS_PATH}?q=camp`
    );
    expect(exploreInboundHubRedirectTarget('/explore/hub/map', '?searchScope=places&q=camp')).toContain(
      `${EXPLORE_SEARCH_RESULTS_PATH}?`
    );
    expect(exploreInboundHubRedirectTarget('/explore/hub/home', '')).toContain('search=1');
  });

  it('uses booking search modal on map and list', () => {
    expect(read('src/explore/shell/ExploreMapShell.tsx')).toMatch(/ExploreBookingSearchModal/);
    expect(read('src/explore/shell/ExploreMapShell.tsx')).toMatch(/overlayContained/);
    expect(read('src/explore/ui/ExploreMapStage.tsx')).toMatch(/mapSearchOverlay[\s\S]*pointer-events-auto/);
    expect(read('src/list/BrowseListPage.tsx')).toMatch(/ExploreBookingSearchModalHost/);
    expect(read('src/explore/search/ExploreBookingSearchModal.tsx')).toMatch(/ExploreSearchScopePills/);
    expect(read('src/explore/search/ExploreBookingSearchModal.tsx')).toMatch(/ExploreSearchBookingHero/);
    expect(read('src/explore/search/ExploreBookingSearchModal.tsx')).toMatch(/ExploreBookingRecentSearches/);
    expect(read('src/explore/search/ExploreBookingSearchModal.tsx')).toMatch(/EXPLORE_SEARCH_MAP_MATCHES_TITLE/);
    expect(read('src/explore/search/ExploreBookingSearchModal.tsx')).toMatch(/ExploreBookingSearchMapMatches/);
    expect(read('src/explore/search/ExploreBookingSearchMapMatches.tsx')).toMatch(/EXPLORE_SEARCH_SECTION_TRIPS/);
    expect(read('src/explore/search/ExploreBookingSearchMapMatches.tsx')).toMatch(/EXPLORE_SEARCH_SECTION_CREW/);
  });

  it('embeds unified list on search results', () => {
    expect(read('src/explore/search/ExploreSearchResults.tsx')).toMatch(
      /ListDiscoveryExperience surface="exploreSearch"/
    );
    expect(read('src/explore/search/ExploreSearchResults.tsx')).toMatch(/data-explore-search-layout="unified"/);
    expect(read('src/explore/search/ExploreSearchResults.tsx')).not.toMatch(/ExploreSearchResultsMap/);
    expect(read('src/list/ListDiscoveryExperience.tsx')).toMatch(/presentation="primary"/);
    expect(read('src/list/explorer/ListDiscoveryMapColumn.tsx')).toMatch(/presentation/);
    expect(read('src/explore/search/ExploreSearchResultsChrome.tsx')).toMatch(
      /ExploreSearchResultsViewToggle/
    );
    expect(read('src/list/ListDiscoveryExperience.tsx')).toMatch(/!exploreSearch/);
    expect(read('src/list/ListDiscoveryExperience.tsx')).toMatch(/exploreSearch/);
    expect(read('src/list/shell/useListDiscoveryExperienceModel.ts')).toMatch(/resolveExploreSearchTripPool/);
  });

  it('resolves five-tab highlight from search scope', () => {
    expect(resolveMobileBottomTab('/explore/search', '?q=hatta')).toBe('trips');
    expect(resolveMobileBottomTab('/explore/search', '?searchScope=places')).toBe('venues');
    expect(resolveMobileBottomTab('/explore/search', '?searchScope=crew')).toBe('crews');
  });

  it('round-trips list ↔ map view on search results', () => {
    const listSearch = '?listCat=venues&searchScope=places&q=camp';
    const mapPath = exploreSearchMapViewPathFromListSearch(listSearch);
    expect(mapPath.startsWith(EXPLORE_SEARCH_RESULTS_PATH)).toBe(true);
    expect(mapPath).toContain('view=map');
    const listPath = exploreSearchListPathFromMapSearch(mapPath.slice(mapPath.indexOf('?')));
    expect(listPath.startsWith(EXPLORE_SEARCH_RESULTS_PATH)).toBe(true);
    expect(listPath).toMatch(/listCat=venues/);
  });

  it('builds search results URLs with scope', () => {
    expect(exploreSearchResultsPath({ query: 'dubai', searchScope: 'places' })).toMatch(
      /searchScope=places/
    );
    expect(EXPLORE_SEARCH_RESULTS_PATH).toBe('/explore/search');
  });
});