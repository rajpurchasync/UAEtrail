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
    expect(barrel).toMatch(/discoverySessionListUrl/);
    expect(barrel).toMatch(/discoverySessionGeoUrl/);
    expect(barrel).toMatch(/discoverySessionMapHandoff/);
    expect(barrel).toMatch(/discoverySessionListRouting/);
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
    expect(read('src/discovery/discoverySession.ts')).toMatch(/discoverySessionListFilters/);
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

  it('W4r explore imports geo + FAB copy via discoverySession barrel', () => {
    const geoCopy = /list\/browse\/(?:browseGeoPath|browseListCopy)/;
    const violations: string[] = [];
    for (const rel of collectProdTsUnder(join(ROOT, 'src/explore'))) {
      if (geoCopy.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
    expect(read('src/discovery/discoverySession.ts')).toMatch(/discoverySessionListCopy/);
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

  it('explore tree imports list routing via discoverySessionListRouting', () => {
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

  it('discoverySessionListUrl is the outward facade (spine + list parsers)', () => {
    const facade = read('src/discovery/discoverySessionListUrl.ts');
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
    const allowed = new Set(['src/discovery/discoverySessionListUrl.ts']);
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
    expect(results).not.toMatch(/discoverySessionListUrl/);
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