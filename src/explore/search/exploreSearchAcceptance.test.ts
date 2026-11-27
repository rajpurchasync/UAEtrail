import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  EXPLORE_SEARCH_COMPOSE_PARAM,
  EXPLORE_SEARCH_RESULTS_PATH,
  exploreSearchHomePath,
  exploreSearchListPathFromMapSearch,
  exploreSearchMapViewPathFromListSearch,
  exploreSearchResultsPath,
  isExploreSearchHomeState,
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
      'src/explore/search/ExploreSearchRecommendedScopePills.tsx',
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

  it('does not mount /explore/hub redirect shims (GW-7)', () => {
    expect(existsSync(join(process.cwd(), 'src/explore/search/ExploreInboundHubRedirect.tsx'))).toBe(false);
    const routing = read('src/explore/search/exploreSearchRouting.ts');
    expect(routing).not.toMatch(/exploreInboundHubRedirectTarget/);
  });

  it('uses full-page search home on /explore/search', () => {
    expect(read('src/explore/search/ExploreSearchResultsPage.tsx')).toMatch(/ExploreSearchPageLayout/);
    expect(read('src/explore/search/ExploreSearchResultsPage.tsx')).toMatch(/ExploreSearchHome/);
    expect(read('src/explore/search/ExploreSearchHome.tsx')).toMatch(/ExploreSearchRecommendedSection/);
    expect(read('src/explore/search/ExploreSearchRecommendedSection.tsx')).toMatch(
      /ExploreSearchRecommendedScopePills/
    );
    expect(read('src/explore/search/ExploreSearchRecommendedSection.tsx')).toMatch(
      /useExploreSearchRecommendedCrew/
    );
    expect(read('src/explore/search/ExploreSearchRecommendedSection.tsx')).toMatch(/CrewBrowseMemberRow/);
    expect(read('src/explore/search/ExploreSearchHome.tsx')).toMatch(/exploreSearchComposeFeedMode/);
    expect(read('src/explore/search/ExploreSearchRecommendedScopePills.tsx')).toMatch(
      /EXPLORE_SEARCH_SECTION_GROUPS/
    );
    expect(read('src/explore/search/ExploreSearchRecommendedScopePills.tsx')).toMatch(/onChange\('groups'\)/);
    expect(read('src/explore/search/exploreSearchRouting.ts')).toMatch(/'groups'/);
    expect(read('src/explore/search/ExploreSearchRecommendedSection.tsx')).not.toMatch(
      /categories:\s*\['people'\]/
    );
    expect(read('src/explore/search/ExploreSearchResults.tsx')).toMatch(/useExploreSearchRecommendedCrew/);
    expect(read('src/explore/search/ExploreSearchHome.tsx')).toMatch(/ExploreSearchBookingHero/);
    expect(read('src/explore/search/ExploreSearchHome.tsx')).toMatch(/ExploreBookingRecentSearches/);
    expect(read('src/explore/search/ExploreSearchHome.tsx')).toMatch(/ExploreSearchRecommendedSection/);
    expect(read('src/explore/shell/ExploreMapShell.tsx')).not.toMatch(/ExploreBookingSearchModal/);
    expect(read('src/list/BrowseListPage.tsx')).toMatch(/ExploreSearchInboundRedirectHost/);
    expect(read('src/explore/search/ExploreBookingSearchMapMatches.tsx')).toMatch(/EXPLORE_SEARCH_SECTION_TRIPS/);
    expect(read('src/explore/search/ExploreBookingSearchMapMatches.tsx')).toMatch(/EXPLORE_SEARCH_SECTION_CREW/);
    expect(isExploreSearchHomeState(EXPLORE_SEARCH_RESULTS_PATH, new URLSearchParams(`${EXPLORE_SEARCH_COMPOSE_PARAM}=1`))).toBe(
      true
    );
    expect(isExploreSearchHomeState(EXPLORE_SEARCH_RESULTS_PATH, new URLSearchParams('q=hike'))).toBe(false);
    expect(exploreSearchHomePath()).toContain(EXPLORE_SEARCH_COMPOSE_PARAM);
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
    expect(read('src/list/shell/useListDiscoveryExperienceModel.ts')).toMatch(/!exploreSearch/);
    expect(read('src/list/ListDiscoveryExperience.tsx')).toMatch(/exploreSearch/);
    expect(read('src/list/shell/useListDiscoveryExploreSearchFeedModel.ts')).toMatch(/resolveExploreSearchTripPool/);
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