import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const collectProdTsUnder = (dir: string): string[] => {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules') continue;
      out.push(...collectProdTsUnder(full));
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

/** W4 — explore must use discovery session spine for shared URL keys, not list/browse. */
describe('discoverySessionParamsGuard', () => {
  it('explore browse URL spine imports discoverySession barrel', () => {
    for (const rel of ['src/explore/exploreBrowseUrlHydrate.ts', 'src/explore/exploreBrowseUrlSync.ts']) {
      const content = read(rel);
      expect(content).toMatch(/from '\.\.\/discovery\/discoverySession'/);
      expect(content).not.toMatch(/discoverySessionParams'/);
      expect(content).not.toMatch(/discoverySessionParsers'/);
      expect(content).not.toMatch(/discoverySessionGeoUrl'/);
    }
    expect(read('src/explore/search/exploreSearchRouting.ts')).toMatch(
      /from '\.\.\/\.\.\/discovery\/discoverySession'/
    );
  });

  it('browseListUrlState imports spine keys but does not re-export them', () => {
    const browse = read('src/list/browse/browseListUrlState.ts');
    expect(browse).toMatch(/from '\.\.\/\.\.\/discovery\/discoverySessionParams'/);
    expect(browse).toMatch(/discovery\/discoverySessionParsers/);
    expect(browse).not.toMatch(/export \{[^}]*LIST_CAT_PARAM/);
  });

  it('W4k discoverySession barrel re-exports spine facades', () => {
    const barrel = read('src/discovery/discoverySession.ts');
    expect(barrel).toMatch(/discoverySessionParams/);
    expect(barrel).toMatch(/discoveryPortListUrl/);
    expect(barrel).toMatch(/discoverySessionGeoUrl/);
    expect(barrel).toMatch(/discoverySessionMapHandoff/);
    expect(barrel).toMatch(/discoveryPortListUrl/);
    expect(barrel).toMatch(/discoverySessionPeopleUrl/);
    expect(barrel).not.toMatch(/list\/browse\/browseListUrlState/);
  });

  it('mobile + social chrome import list routing via discoverySession barrel', () => {
    for (const rel of [
      'src/components/mobile/MobileTabHeader.tsx',
      'src/components/social/MyCrewSurfacePanel.tsx',
    ]) {
      expect(read(rel)).toMatch(/discoverySession/);
      expect(read(rel)).not.toMatch(/list\/browse\/browseListRouting/);
    }
  });

  it('W4t explore filter types import via discoverySession barrel', () => {
    const filterImport = /list\/browse\/browseListFilters/;
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/explore'))) {
      if (filterImport.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(read('src/discovery/discoverySession.ts')).toMatch(/discoveryPortListBrowseFilters/);
  });

  it('W4s explore imports list hooks via discoverySession barrel', () => {
    const hookImport =
      /list\/browse\/(?:useBrowseGeoScopeHydration|useBrowseListFeed|useBrowseViewerLocation|viewerLocationStorage)/;
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/explore'))) {
      if (hookImport.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
  });

  it('W4u explore imports list chrome via discoverySession barrel', () => {
    const chromeImport = /list\/browse\/listChromeTheme/;
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/explore'))) {
      if (chromeImport.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(read('src/discovery/discoverySession.ts')).toMatch(/discoveryPortListBrowseCard/);
  });

  it('W7b explore peek imports list/browse chrome via discoverySession barrel', () => {
    const listPeekImport =
      /list\/browse\/(?:browseCatalogLabels|browseCardMeta|browsePosterCover|placeDistance|venueBrowseFacts|listFeedFooterActions|tripBrowseCardCopy)/;
    const discoveryPeekImport =
      /discovery\/browse\/(?:resolveDiscoveryBrowseListImageChrome|discoveryBrowseListChrome|DiscoveryBrowseCardMetaSlot)/;
    const peekRoots = [
      join(ROOT, 'src/explore/ui/peek'),
      join(ROOT, 'src/explore/ui/map-peek'),
    ];
    const violations: string[] = [];
    for (const root of peekRoots) {
      for (const rel of collectProdTsUnder(root)) {
        const content = read(rel);
        if (listPeekImport.test(content) || discoveryPeekImport.test(content)) violations.push(rel);
      }
    }
    expect(violations).toEqual([]);
    expect(read('src/discovery/discoverySession.ts')).toMatch(/discoveryPortListPeek/);
  });

  it('W4r explore imports geo + FAB copy via discoverySession barrel', () => {
    const geoCopy = /list\/browse\/(?:browseGeoPath|browseListCopy)/;
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/explore'))) {
      if (geoCopy.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(read('src/discovery/discoverySession.ts')).toMatch(/discoveryPortListBrowseCard/);
  });

  it('W4q explore browse/search spine imports listCat type via discoverySession barrel', () => {
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/explore'))) {
      if (/list\/browse\/browseListTaxonomy/.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(read('src/discovery/discoverySession.ts')).toMatch(/discoverySessionTaxonomy/);
  });

  it('W4p my-crew and list shell import list routing via discoverySession barrel', () => {
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/my-crew'))) {
      if (/list\/browse\/browseListRouting/.test(read(rel))) violations.push(rel);
    }
    for (const rel of [
      'src/list/shell/useListDiscoveryExploreSearchFeedModel.ts',
      'src/list/explorer/FindCrewHubBackLink.tsx',
      'src/list/explorer/ListCrewsExplorer.tsx',
      'src/list/crews/CrewsHubAppBar.tsx',
    ]) {
      if (/list\/browse\/browseListRouting/.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
  });

  it('routingCatalog and geo browse import list paths via discoverySession barrel', () => {
    for (const rel of ['src/config/routingCatalog.ts', 'src/geo/GeoBrowsePane.tsx']) {
      const content = read(rel);
      expect(content).toMatch(/discoverySession/);
      expect(content).not.toMatch(/list\/browse\/browseListRouting/);
    }
  });

  it('explore tree imports list routing via discoveryPortListUrl', () => {
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/explore'))) {
      if (/list\/browse\/browseListRouting/.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
  });

  it('explore search imports map handoff via discoverySession barrel (not browseListMapHandoff)', () => {
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/explore/search'))) {
      if (/browseListMapHandoff/.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(read('src/explore/search/exploreSearchRouting.ts')).toMatch(/discovery\/discoverySession'/);
  });

  it('explore browse URL spine uses discoverySession barrel (not list browseGeoPath)', () => {
    for (const rel of ['src/explore/exploreBrowseUrlHydrate.ts', 'src/explore/exploreBrowseUrlSync.ts']) {
      const content = read(rel);
      expect(content).toMatch(/discovery\/discoverySession'/);
      expect(content).not.toMatch(/list\/browse\/browseGeoPath/);
    }
  });

  it('discoveryPortListUrl is the outward facade (spine + list parsers + routing)', () => {
    const facade = read('src/discovery/discoveryPortListUrl.ts');
    expect(facade).toMatch(/discoverySessionParams/);
    expect(facade).toMatch(/discoverySessionParsers/);
    expect(facade).toMatch(/browseListUrlState/);
    expect(facade).toMatch(/browseListRouting/);
  });

  it('platform nav imports listCat via discoverySession barrel (not browseListUrlState)', () => {
    for (const rel of ['src/config/desktopNav.ts', 'src/config/mobileFiveTabNav.ts']) {
      const content = read(rel);
      expect(content).toMatch(/discovery\/discoverySession'/);
      expect(content).not.toMatch(/list\/browse\/browseListUrlState/);
    }
  });

  it('list/browse spine keys come from discovery modules (not browseListUrlState re-exports)', () => {
    const spineImport =
      /import\s*\{[^}]*(?:LIST_CAT_PARAM|BROWSE_DISCOVER_PARAM|parseListCatParam)[^}]*\}\s*from\s*['"]\.\/browseListUrlState['"]/;
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/list/browse'))) {
      if (rel === 'src/list/browse/browseListUrlState.ts') continue;
      if (spineImport.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
  });

  it('browseListUrlState imports confined to list/browse + discovery facade', () => {
    const importPattern = /from ['"].*list\/browse\/browseListUrlState['"]/;
    const allowed = new Set(['src/discovery/discoveryPortListUrl.ts']);
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src'))) {
      if (rel.startsWith('src/list/browse/')) continue;
      if (allowed.has(rel)) continue;
      if (importPattern.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
  });

  it('explore search imports list URL via discovery facades (not browseListUrlState)', () => {
    const routing = read('src/explore/search/exploreSearchRouting.ts');
    expect(routing).toMatch(/discovery\/discoverySession'/);
    expect(routing).not.toMatch(/list\/browse\/browseListUrlState/);
    const results = read('src/explore/search/ExploreSearchResults.tsx');
    expect(results).toMatch(/discovery\/discoverySession'/);
    expect(results).not.toMatch(/discoveryPortListUrl/);
  });

  it('W4n list/browse uses discoverySession barrel (except browseListUrlState impl)', () => {
    const splitFacade =
      /from ['"][^'"]*discovery\/discoverySession(?:Params|Parsers|ListUrl|GeoUrl|MapHandoff|ListRouting)['"]/;
    const violations: string[] = [];
    const allow = new Set(['src/list/browse/browseListUrlState.ts']);
    for (const rel of collectProdTsUnder(join(ROOT, 'src/list/browse'))) {
      if (allow.has(rel)) continue;
      if (splitFacade.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
  });

  it('W4o explore tree imports people list URL via discoverySession barrel', () => {
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/explore'))) {
      if (/list\/browse\/peopleListBrowseUrl/.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(read('src/explore/exploreBrowseUrlSync.ts')).toMatch(/serializePeopleListBrowseState/);
    expect(read('src/explore/exploreBrowseUrlSync.ts')).toMatch(/discovery\/discoverySession'/);
  });

  it('W7a explore (non-peek) imports list feed via discoverySession barrel', () => {
    const feedImport =
      /list\/browse\/(?:buildListFeedCards|listBrowseSort|BrowseCompactRow|browseCardMeta|browseCardChrome)/;
    const peekPrefix = /^src\/explore\/ui\/(?:peek|map-peek)\//;
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/explore'))) {
      if (peekPrefix.test(rel)) continue;
      if (feedImport.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(read('src/discovery/discoverySession.ts')).toMatch(/discoveryPortListFeed/);
  });

  it('W8 explore imports list quick filters via discoverySession barrel', () => {
    const quickFilterImport =
      /list\/browse\/(?:browseListBucket|browseListTripTopics|listVenuePlaceTopics|listQuickFilterPills|listBrowseFilterModal)/;
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/explore'))) {
      if (quickFilterImport.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(read('src/discovery/discoverySession.ts')).toMatch(/discoveryPortListBrowseFilters/);
  });

  it('W13 list wire imports explore via discoveryPortExplore* facades', () => {
    const expectations: Array<{ rel: string; facade: RegExp; avoidDirect?: RegExp }> = [
      {
        rel: 'src/list/browse/browseCatalogLabels.ts',
        facade: /discoveryPortExploreCatalogFilters/,
        avoidDirect: /explore\/exploreCatalogHubLabel|exploreCatalogLabel/,
      },
      {
        rel: 'src/list/browse/browseListBucket.ts',
        facade: /discoveryPortExploreCatalogFilters/,
        avoidDirect: /from ['"][^'"]*explore\/exploreBrowseTaxonomy/,
      },
      {
        rel: 'src/list/browse/browseListNavState.ts',
        facade: /discoveryPortExploreRouting/,
      },
      {
        rel: 'src/list/browse/listVenuePlaceTopics.ts',
        facade: /discoveryPortExplore(Routing|CatalogFilters)/,
      },
      {
        rel: 'src/list/browse/tripBrowseCardCopy.ts',
        facade: /discoveryPortExploreCardChrome/,
      },
      {
        rel: 'src/list/browse/ListFeedActionsProvider.tsx',
        facade: /discoveryPortExploreRouting/,
        avoidDirect: /explore\/mapPeekDetailNavState/,
      },
      {
        rel: 'src/list/explorer/ListExplorerFilterPop.tsx',
        facade: /discoveryPortExploreOptionalFilters/,
      },
      {
        rel: 'src/list/explorer/ListDiscoverySearchField.tsx',
        facade: /discoveryPortExploreSearch(Routing)?|discoveryPortExploreCatalogFilters/,
        avoidDirect: /explore\/exploreBrowseTaxonomy|explore\/exploreSearchScopeUi/,
      },
      {
        rel: 'src/list/shell/useListDiscoveryBrowseUrlModel.ts',
        facade: /discoveryPortExploreBrowseHooks|discoveryPortExploreCatalogFilters/,
      },
      {
        rel: 'src/list/shell/useListDiscoveryExploreSearchFeedModel.ts',
        facade: /discoveryPortExploreSearchRouting/,
      },
      {
        rel: 'src/list/explorer/FindCrewResultsSection.tsx',
        facade: /discoveryPortExploreSearchRouting/,
        avoidDirect: /explore\/search\/exploreSearchJoinablePools/,
      },
    ];
    for (const { rel, facade, avoidDirect } of expectations) {
      const content = read(rel);
      expect(content, rel).toMatch(facade);
      if (avoidDirect) {
        expect(content, rel).not.toMatch(avoidDirect);
      }
    }
  });

  const discoveryListFacadeRe =
    /^src\/discovery\/(?:discoveryPortList|discoverySession(?:List|GeoUrl|MapHandoff|PeopleUrl|FindCrew|Params|Parsers|Taxonomy|Explore)|discoveryBrowse(?:ListSession|Session|ListUrl))/;

  it('W15 discovery prod routes list browse through discoveryPortList* facades', () => {
    const directList = /from ['"][^'"]*list\//;
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/discovery'))) {
      if (discoveryListFacadeRe.test(rel)) continue;
      if (directList.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
  });

  it('W14 list prod avoids direct explore/* imports (split discoveryPortExplore* facades)', () => {
    const directExplore = /from ['"][^'"]*explore\//;
    const joinOverlayAllow = new Set(['src/list/browse/ListFeedActionsProvider.tsx']);
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/list'))) {
      if (joinOverlayAllow.has(rel)) continue;
      if (directExplore.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(read('src/discovery/discoverySession.ts')).not.toMatch(/discoveryPortExploreBrowse/);
  });

  it('W12 list module avoids direct discoveryRuntime; optional filter URL via facades', () => {
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/list'))) {
      if (/explore\/discoveryRuntime/.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(existsSync(join(ROOT, 'src/discovery/discoveryPortExploreRuntime.ts'))).toBe(false);
    expect(read('src/list/browse/browseListUrlState.ts')).toMatch(/discoveryPortExploreOptionalFilters/);
    expect(read('src/list/browse/browseListUrlState.ts')).toMatch(/discoveryPortExploreRouting/);
    expect(read('src/discovery/discoveryPortExploreOptionalFilters.ts')).toMatch(/parseExplorePriceFilter/);
    expect(read('src/discovery/discoveryPortExploreOptionalFilters.ts')).toMatch(/ExploreOptionalFilterRow/);
    expect(read('src/discovery/discoveryPortExploreOptionalFilters.ts')).toMatch(
      /from '\.\.\/explore\/exploreOptionalFilters'/
    );
    expect(read('src/discovery/discoveryPortExploreRouting.ts')).toMatch(/parseMapFilter/);
    expect(read('src/discovery/discoveryPortExploreRouting.ts')).toMatch(/buildMapPeekReturnPath/);
    expect(read('src/explore/mapPeekDetailNavState.ts')).not.toMatch(/config\/routingCatalog/);
    expect(read('src/utils/mobileBackNav.ts')).not.toMatch(/config\/routingCatalog/);
    expect(read('src/utils/mobileBackNav.ts')).toMatch(/discoveryPortExploreRouting/);
    expect(read('src/discovery/discoveryPortExploreRouting.ts')).toMatch(
      /exploreMapPathAfterPeopleFullScreen/
    );
    expect(read('src/discovery/discoveryPortExploreBrowseUrl.ts')).not.toMatch(
      /exploreMapPathAfterPeopleFullScreen/
    );
    expect(read('src/discovery/discoveryPortExploreGuest.ts')).not.toMatch(/resolveWelcomeFinishExplorePath/);
    expect(read('src/discovery/discoveryPortExploreGuestWire.ts')).toMatch(/resolveWelcomeFinishExplorePath/);
    expect(read('src/explore/exploreWelcomeNavigation.ts')).not.toMatch(/config\/routingCatalog/);
    expect(read('src/components/auth/ProtectedRoute.tsx')).toMatch(/discoveryPortExploreGuestWire/);
    expect(read('src/components/auth/ProtectedRoute.tsx')).not.toMatch(/discoveryPortExploreGuest['"]/);
    expect(read('src/config/desktopNav.ts')).not.toMatch(/discoveryPortExploreBrowse/);
    expect(read('src/config/desktopNav.ts')).toMatch(/isDiscoverBrowseRoute/);
    expect(read('src/discovery/discoveryPortExploreRouting.ts')).toMatch(/isDiscoverBrowseRoute/);
    expect(read('src/discovery/discoveryPortExploreBrowseUrl.ts')).not.toMatch(/isDiscoverBrowseRoute/);
    expect(read('src/discovery/discoveryPortExploreSearch.ts')).not.toMatch(/exploreItemMatchesQuery/);
    expect(read('src/explore/ui/useExploreMapViewport.ts')).toMatch(/discoveryPortExploreGuestWire/);
    expect(read('src/list/shell/useListDiscoveryExploreSearchFeedModel.ts')).not.toMatch(/routingCatalog/);
    expect(read('src/list/shell/useListDiscoveryExploreSearchFeedModel.ts')).toMatch(/config\/platform/);
    expect(read('src/discovery/discoveryPortExploreMapPin.ts')).toMatch(/isPlacesMapItem/);
    expect(read('src/discovery/discoveryPortExploreBrowseUrl.ts')).not.toMatch(/isPlacesMapItem/);
    expect(read('src/list/browse/browseListFilters.ts')).toMatch(/discoveryPortExploreMapPin/);
    expect(read('src/discovery/discoveryPortExploreCatalogFilters.ts')).toMatch(/parseExploreDestinationSlug/);
    expect(read('src/discovery/discoveryPortExploreBrowseUrl.ts')).not.toMatch(/parseExploreDestinationSlug/);
    expect(read('src/list/browse/ListFeedActionsProvider.tsx')).not.toMatch(/routingCatalog/);
    expect(read('src/list/browse/ListFeedActionsProvider.tsx')).toMatch(/activityDetailPath/);
    expect(read('src/discovery/discoveryPortExploreGuestWire.ts')).toMatch(
      /EXPLORE_GUEST_MAP_PREVIEW_MAX_MATCHES/
    );
    expect(read('src/discovery/discoveryPortExploreGuestWire.ts')).not.toMatch(/exploreBrowseTaxonomy/);
    expect(read('src/discovery/discoveryPortExploreGuestWire.ts')).toMatch(/EXPLORE_SEARCH_GUEST_PLACEHOLDER/);
    expect(read('src/explore/exploreBrowseTaxonomy.ts')).not.toMatch(/EXPLORE_GUEST_MAP_PREVIEW_MAX_MATCHES/);
    expect(read('src/explore/exploreBrowseTaxonomy.ts')).not.toMatch(/EXPLORE_SEARCH_GUEST_PLACEHOLDER/);
    expect(read('src/discovery/discoveryPortExploreBrowseUrl.ts')).not.toMatch(
      /EXPLORE_GUEST_MAP_PREVIEW_NOTICE/
    );
    expect(read('src/discovery/discoveryPortExploreCatalogFilters.ts')).toMatch(
      /EXPLORE_SEARCH_OPEN_PLACEHOLDER/
    );
    expect(read('src/discovery/discoveryPortExploreSearchRouting.ts')).not.toMatch(
      /exploreBrowseTaxonomy/
    );
    expect(read('src/list/browse/browseListCopy.ts')).toMatch(/discoveryPortExploreCatalogFilters/);
    expect(read('src/list/shell/useListDiscoveryBrowseUrlModel.ts')).toMatch(/isSignedIn/);
    expect(read('src/content/guestBrowseGateCopy.ts')).toMatch(/discoveryPortExploreGuestWire/);
    expect(existsSync(join(ROOT, 'src/discovery/discoveryPortExploreBrowse.ts'))).toBe(false);
    expect(read('src/discovery/discoveryPortExploreBrowseUrl.ts')).toMatch(/useExploreBrowseUrlState/);
    expect(read('src/crew-discovery/hooks/useCrewDiscoveryBrowseBundle.ts')).toMatch(/discoveryPortExploreBrowseUrl/);
    expect(read('src/discovery/discoveryPortExploreBrowseHooks.ts')).toMatch(/useExplorePublishedDestinationsQuery/);
    expect(read('src/discovery/discoveryPortExploreBrowseUrl.ts')).not.toMatch(/useExplorePublishedDestinationsQuery/);
    expect(read('src/config/useExploreRegionPillOptions.ts')).toMatch(/discoveryPortExploreBrowseHooks/);
    expect(read('src/config/useExploreRegionPillOptions.ts')).not.toMatch(/discoveryPortExploreBrowse['"]/);
    expect(read('src/discovery/discoveryPortExploreBrowseUrl.ts')).not.toMatch(/ExploreSearchScopeCounts/);
    expect(read('src/discovery/discoveryPortExploreBrowseUrl.ts')).not.toMatch(/parseExploreMapFilterPillsParam/);
    expect(read('src/discovery/discoveryPortExploreBrowseUrl.ts')).not.toMatch(/EXPLORE_DESKTOP_BROWSE_RAIL/);
    expect(read('src/discovery/discoveryPortExploreCatalogFilters.ts')).toMatch(/parseExploreMapFilterPillsParam/);
    expect(read('src/discovery/discoveryPortExploreMapChrome.ts')).toMatch(/EXPLORE_DESKTOP_BROWSE_RAIL_SCROLL_CLASS/);
    expect(read('src/discovery/discoveryPortExploreCatalogFilters.ts')).toMatch(/ExploreSearchScopeCounts/);
    expect(read('src/discovery/discoveryPortExploreSearchRouting.ts')).not.toMatch(/ExploreSearchScopeCounts/);
    expect(read('src/list/explorer/ListDiscoverySearchField.tsx')).toMatch(/discoveryPortExploreCatalogFilters/);
    expect(read('src/list/browse/browseListTaxonomy.ts')).toMatch(/discoveryPortExploreCatalogFilters/);
    expect(read('src/list/browse/listVenuePlaceTopics.ts')).toMatch(/discoveryPortExploreRouting/);
    expect(read('src/list/browse/listVenuePlaceTopics.ts')).not.toMatch(/routingCatalog/);
    expect(read('src/list/browse/useListDiscoveryUrlState.ts')).toMatch(/discoveryPortExploreSearchRouting/);
    expect(read('src/list/browse/useListDiscoveryUrlState.ts')).not.toMatch(/discoveryPortExploreSearch['"]/);
    expect(read('src/list/explorer/FindCrewCommunityCard.tsx')).not.toMatch(/routingCatalog/);
    expect(read('src/discovery/discoveryPortExploreSearchRouting.ts')).toMatch(/exploreSearchScopesForQuery/);
    expect(read('src/list/explorer/ListDiscoverySearchField.tsx')).toMatch(/exploreSearchScopesForQuery/);
    expect(read('src/discovery/discoveryPortExploreSearchRouting.ts')).toMatch(/resolveExploreSearchTripPool/);
    expect(read('src/discovery/discoveryPortExploreSearch.ts')).not.toMatch(/resolveExploreSearchTripPool/);
    expect(read('src/discovery/discoveryPortExploreSearch.ts')).not.toMatch(/discoveryPortExploreSearchRouting/);
    expect(read('src/list/shell/useListDiscoveryExploreSearchFeedModel.ts')).toMatch(
      /discoveryPortExploreSearchRouting/
    );
    expect(read('src/list/shell/useListDiscoveryExploreSearchFeedModel.ts')).not.toMatch(
      /discoveryPortExploreSearchFeed/
    );
    expect(read('src/list/shell/useListDiscoveryExploreSearchFeedModel.ts')).not.toMatch(
      /discoveryPortExploreSearch['"]/
    );
    expect(read('src/discovery/discoveryPortExploreOptionalFilters.ts')).toMatch(/exploreItemMatchesPriceFilter/);
    expect(read('src/discovery/discoveryPortExploreMapClient.ts')).toMatch(/serializeExplorePinKindFilter/);
    expect(read('src/discovery/discoveryPortExploreMapClient.ts')).toMatch(/exploreMapItemPathFromAvailabilityRow/);
    expect(read('src/discovery/discoveryPortExploreFlowChrome.ts')).toMatch(/AvailabilityMatchPreview/);
    expect(read('src/discovery/discoveryPortExploreMapPin.ts')).not.toMatch(/ExploreJoinOverlays/);
    expect(read('src/discovery/discoveryPortExploreCardChrome.ts')).not.toMatch(
      /ActivityPeekLinkedTransport/
    );
    expect(read('src/discovery/discoveryPortExploreFlowChrome.ts')).toMatch(/ActivityPeekLinkedTransport/);
    expect(read('src/discovery/discoveryPortExploreFlowChrome.ts')).not.toMatch(/ExploreJoinOverlays/);
    expect(read('src/list/browse/ListFeedActionsProvider.tsx')).toMatch(
      /from '\.\.\/\.\.\/explore\/ui\/ExploreJoinOverlays'/
    );
    expect(read('src/discovery/discoveryPortExploreSearchRouting.ts')).toMatch(/exploreItemMatchesQuery/);
    expect(read('src/list/shell/useListDiscoveryExperienceModel.ts')).toMatch(
      /discoveryPortExploreSearch(Routing)?/
    );
    expect(read('src/activity-discovery/catalog/activities.ts')).toMatch(/discoveryPortExploreOptionalFilters/);
    expect(read('src/activity-discovery/catalog/activities.ts')).not.toMatch(
      /discoveryPortExploreOptionalFilterWire/
    );
  });

  it('W11 list module imports activity date preset via discoveryPortExploreOptionalFilters', () => {
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/list'))) {
      if (/explore\/exploreActivityDateFilter/.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(read('src/discovery/discoveryPortExploreOptionalFilters.ts')).toMatch(/serializeExploreActivityDatePreset/);
    expect(read('src/discovery/discoveryPortExploreOptionalFilters.ts')).toMatch(/parseExploreActivityDatePreset/);
  });

  it('W10 list module imports explore search via discoveryPortExploreSearch facade', () => {
    const exploreSearchImport = /explore\/search\//;
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/list'))) {
      if (exploreSearchImport.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(read('src/discovery/discoveryPortExploreSearch.ts')).toMatch(/ExploreSearchScopeHints/);
    expect(read('src/discovery/discoveryPortExploreSearch.ts')).not.toMatch(/discoveryPortExploreSearchRouting/);
  });

  it('W9 explore imports list explorer / shell / prefill via discoverySession facades', () => {
    const listPresentationImport =
      /list\/(?:explorer\/|ListDiscoveryExperience|crews\/CommunityDiscoverBrowseList)/;
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/explore'))) {
      if (listPresentationImport.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(read('src/discovery/discoveryPortListEmbed.ts')).toMatch(/ListExplorerGeoScopeChip/);
    expect(read('src/discovery/discoveryPortListEmbed.ts')).toMatch(/ListDiscoveryExperience/);
    expect(read('src/discovery/discoverySessionFindCrewPrefill.ts')).toMatch(/findCrewPlanAnchor/);
  });

  it('W4m explore tree uses discoverySession barrel (no split facade imports)', () => {
    const splitFacade =
      /from ['"][^'"]*discovery\/discoverySession(?:Params|Parsers|ListUrl|GeoUrl|MapHandoff|ListRouting)['"]/;
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/explore'))) {
      if (splitFacade.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
  });
});