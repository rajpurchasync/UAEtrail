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
  it('exploreBrowseUrlHydrate imports shared URL keys from discovery session spine', () => {
    const hydrate = read('src/explore/exploreBrowseUrlHydrate.ts');
    expect(hydrate).toMatch(
      /import \{[^}]*BROWSE_DISCOVER_PARAM, LIST_CAT_PARAM[^}]*\} from '\.\.\/discovery\/discoverySessionParams'/
    );
    expect(hydrate).toMatch(/parseListCatParam.*from '\.\.\/discovery\/discoverySessionParsers'/);
  });

  it('browseListUrlState re-exports shared keys from discovery session spine', () => {
    const browse = read('src/list/browse/browseListUrlState.ts');
    expect(browse).toMatch(/from '\.\.\/\.\.\/discovery\/discoverySessionParams'/);
    expect(browse).toMatch(/LIST_CAT_PARAM/);
    expect(browse).toMatch(/BROWSE_DISCOVER_PARAM/);
    expect(browse).toMatch(/discovery\/discoverySessionParsers/);
  });

  it('exploreBrowseUrlSync parses listCat via discoverySessionParsers', () => {
    const sync = read('src/explore/exploreBrowseUrlSync.ts');
    expect(sync).toMatch(/from '\.\.\/discovery\/discoverySessionParsers'/);
  });

  it('platform nav imports listCat via discovery session spine (not browseListUrlState)', () => {
    for (const rel of ['src/config/desktopNav.ts', 'src/config/mobileFiveTabNav.ts']) {
      const content = read(rel);
      expect(content).toMatch(/discovery\/discoverySessionParams/);
      expect(content).not.toMatch(/list\/browse\/browseListUrlState/);
    }
    expect(read('src/config/mobileFiveTabNav.ts')).toMatch(/discoverySessionParsers/);
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

  it('explore search imports list URL parsers via discoverySessionListUrl facade', () => {
    const routing = read('src/explore/search/exploreSearchRouting.ts');
    expect(routing).toMatch(/from '\.\.\/\.\.\/discovery\/discoverySessionListUrl'/);
    expect(routing).not.toMatch(/from '\.\.\/\.\.\/list\/browse\/browseListUrlState'/);
    const results = read('src/explore/search/ExploreSearchResults.tsx');
    expect(results).toMatch(/discoverySessionListUrl/);
  });
});