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
    expect(barrel).toMatch(/discoveryPortListRouting/);
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
    expect(read('src/discovery/discoverySession.ts')).toMatch(/discoveryPortListFilters/);
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
    expect(read('src/discovery/discoverySession.ts')).toMatch(/discoveryPortListChrome/);
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
    expect(read('src/discovery/discoverySession.ts')).toMatch(/discoveryPortListCopy/);
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

  it('explore tree imports list routing via discoveryPortListRouting', () => {
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

  it('discoveryPortListUrl is the outward facade (spine + list parsers)', () => {
    const facade = read('src/discovery/discoveryPortListUrl.ts');
    expect(facade).toMatch(/discoverySessionParams/);
    expect(facade).toMatch(/discoverySessionParsers/);
    expect(facade).toMatch(/browseListUrlState/);
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
    expect(read('src/discovery/discoverySession.ts')).toMatch(/discoveryPortListQuickFilters/);
  });

  it('W13 list wire imports explore via discoveryPortExplore* facades', () => {
    const expectations: Array<{ rel: string; facade: RegExp; avoidDirect?: RegExp }> = [
      {
        rel: 'src/list/browse/browseCatalogLabels.ts',
        facade: /discoveryPortExploreListCatalog/,
        avoidDirect: /explore\/exploreCatalogHubLabel|exploreCatalogLabel/,
      },
      {
        rel: 'src/list/browse/browseListBucket.ts',
        facade: /discoveryPortExploreBrowse/,
        avoidDirect: /from ['"][^'"]*explore\/exploreBrowseTaxonomy/,
      },
      {
        rel: 'src/list/browse/browseListNavState.ts',
        facade: /discoveryPortExploreMapPeekNav/,
      },
      {
        rel: 'src/list/browse/listVenuePlaceTopics.ts',
        facade: /discoveryPortExploreListCatalog/,
      },
      {
        rel: 'src/list/browse/tripBrowseCardCopy.ts',
        facade: /discoveryPortExploreCardChrome/,
      },
      {
        rel: 'src/list/browse/ListFeedActionsProvider.tsx',
        facade: /discoveryPortExploreMapPeekNav/,
        avoidDirect: /explore\/mapPeekDetailNavState/,
      },
      {
        rel: 'src/list/explorer/ListExplorerFilterPop.tsx',
        facade: /discoveryPortExploreOptionalFilters/,
      },
      {
        rel: 'src/list/explorer/ListDiscoverySearchField.tsx',
        facade: /discoveryPortExploreBrowse/,
        avoidDirect: /explore\/exploreBrowseTaxonomy|explore\/exploreSearchScopeUi/,
      },
      {
        rel: 'src/list/shell/useListDiscoveryBrowseUrlModel.ts',
        facade: /discoveryPortExploreBrowse/,
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
    /^src\/discovery\/discoverySession(?:List|GeoUrl|MapHandoff|PeopleUrl|FindCrew|Params|Parsers|Taxonomy|Explore)/;

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
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/list'))) {
      if (directExplore.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(read('src/discovery/discoverySession.ts')).not.toMatch(/discoveryPortExploreListChrome/);
  });

  it('W12 list module imports discoveryRuntime via discoveryPortExploreRuntime', () => {
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/list'))) {
      if (/explore\/discoveryRuntime/.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(read('src/discovery/discoveryPortExploreBrowse.ts')).toMatch(/useExplorePublishedDestinationsQuery/);
    expect(read('src/discovery/discoveryPortExploreRuntime.ts')).not.toMatch(/useExplorePublishedDestinationsQuery/);
  });

  it('W11 list module imports activity date preset via discoveryPortExploreActivityDate', () => {
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/list'))) {
      if (/explore\/exploreActivityDateFilter/.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(read('src/discovery/discoveryPortExploreActivityDate.ts')).toMatch(/serializeExploreActivityDatePreset/);
  });

  it('W10 list module imports explore search via discoveryPortExploreSearch facade', () => {
    const exploreSearchImport = /explore\/search\//;
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/list'))) {
      if (exploreSearchImport.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(read('src/discovery/discoveryPortExploreSearch.ts')).toMatch(/exploreSearchRouting/);
  });

  it('W9 explore imports list explorer / shell / prefill via discoverySession facades', () => {
    const listPresentationImport =
      /list\/(?:explorer\/|ListDiscoveryExperience|crews\/CommunityDiscoverBrowseList)/;
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/explore'))) {
      if (listPresentationImport.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(read('src/discovery/discoveryPortListExplorer.ts')).toMatch(/ListExplorerGeoScopeChip/);
    expect(read('src/discovery/discoveryPortListExperience.ts')).toMatch(/ListDiscoveryExperience/);
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