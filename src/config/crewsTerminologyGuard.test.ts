import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src');

const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist']);

const collectTs = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry)) continue;
      out.push(...collectTs(full));
    } else if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !entry.endsWith('.d.ts')) {
      out.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return out;
};

const FORBIDDEN: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bbuddiesDiscoverSegment\b/, label: 'buddiesDiscoverSegment (use peopleBrowseTab)' },
  { pattern: /\bBUDDIES_SEGMENT_URL_PARAM\b/, label: 'BUDDIES_SEGMENT_URL_PARAM (use PEOPLE_LIST_TAB_URL_PARAM)' },
  { pattern: /\bapplyBuddiesDiscoverSegment\b/, label: 'applyBuddiesDiscoverSegment (use applyPeopleBrowseTab)' },
  { pattern: /\bsetBuddiesDiscoverSegment\b/, label: 'setBuddiesDiscoverSegment' },
  { pattern: /params\.set\(['"]buddies['"]/, label: 'serialize buddies= query (outbound retired)' },
];

const ALLOWLIST = new Set([
  'src/config/crewsTerminologyGuard.test.ts',
  'src/list/browse/peopleListBrowseUrl.ts',
]);

describe('crewsTerminologyGuard (Crews / peopleTab — not buddies segment)', () => {
  it('CREWS-01: banned buddies list URL symbols absent from app source', () => {
    const files = collectTs(ROOT);
    const violations: string[] = [];

    for (const file of files) {
      if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue;
      if (ALLOWLIST.has(file)) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      for (const rule of FORBIDDEN) {
        if (rule.pattern.test(content)) {
          violations.push(`${file}: ${rule.label}`);
        }
      }
    }

    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('CREWS-02: explore browse sync strips retired crews inbound params', () => {
    const inbound = readFileSync(join(process.cwd(), 'src/routing/productUrlInbound.ts'), 'utf8');
    expect(inbound).toMatch(/stripRetiredPeopleListTabParams/);
    expect(inbound).toMatch(/params\.delete\(INBOUND_BUDDIES_LIST_TAB_PARAM\)/);
    const sync = readFileSync(join(process.cwd(), 'src/explore/exploreBrowseUrlSync.ts'), 'utf8');
    expect(sync).toMatch(/stripRetiredPeopleListTabParams/);
    expect(sync).toMatch(/PEOPLE_LIST_TAB_URL_PARAM/);
    expect(sync).not.toMatch(/params\.set\('buddies'/);
  });

  it('CREWS-03: single crews tab read path (productUrlInbound)', () => {
    const inbound = readFileSync(join(process.cwd(), 'src/routing/productUrlInbound.ts'), 'utf8');
    expect(inbound).toMatch(/readPeopleCrewsTabParam/);
    expect(readFileSync(join(process.cwd(), 'src/list/browse/peopleListBrowseUrl.ts'), 'utf8')).toMatch(
      /readPeopleCrewsTabParam/
    );
    const hydrate = readFileSync(join(process.cwd(), 'src/explore/exploreBrowseUrlHydrate.ts'), 'utf8');
    expect(hydrate).toMatch(/parseExplorePeopleBrowseTab/);
    expect(hydrate).not.toMatch(/params\.get\('socialTab'\)/);
  });

  it('CREWS-04: list taxonomy people category uses Crews label', () => {
    const taxonomy = readFileSync(join(process.cwd(), 'src/list/browse/browseListTaxonomy.ts'), 'utf8');
    expect(taxonomy).toMatch(/PRODUCT_CREWS_TAB_LABEL/);
    expect(taxonomy).not.toMatch(/label:\s*['"]Buddies['"]/);
  });

  it('CREWS-05: people copy + crews stats use Friends (not Buddies product label)', () => {
    const copy = readFileSync(join(process.cwd(), 'src/content/explorePeopleBrowseCopy.ts'), 'utf8');
    expect(copy).toMatch(/EXPLORE_SEARCH_SCOPE_PEOPLE_LABEL/);
    expect(copy).not.toMatch(/EXPLORE_SEARCH_SCOPE_BUDDIES_LABEL/);
    expect(copy).not.toMatch(/= 'Buddies'/);
    const stats = readFileSync(join(process.cwd(), 'src/list/crews/crewsStatTab.ts'), 'utf8');
    expect(stats).toMatch(/friends: 'Friends'/);
    expect(stats).not.toMatch(/buddies: 'Buddies'/);
    const inbound = readFileSync(join(process.cwd(), 'src/routing/productUrlInbound.ts'), 'utf8');
    expect(inbound).toMatch(/key === 'buddies'\) return 'people'/);
  });

  it('CREWS-07: My Crews canonical route is /crews with /buddies inbound only', () => {
    const surface = readFileSync(join(process.cwd(), 'src/config/surfacePaths.ts'), 'utf8');
    expect(surface).toMatch(/MY_CREWS_PATH = '\/crews'/);
    expect(surface).toMatch(/BUDDIES_PATH = MY_CREWS_PATH/);
    const inbound = readFileSync(join(process.cwd(), 'src/routing/inboundBookmarkRedirects.tsx'), 'utf8');
    expect(inbound).toMatch(/InboundLegacyBuddiesRedirect/);
    expect(readFileSync(join(process.cwd(), 'apps/api/src/lib/member-routes.ts'), 'utf8')).toMatch(
      /BUDDIES_PATH = '\/crews'/
    );
  });

  it('CREWS-06: no Buddies product string in consumer content/components', () => {
    const violations: string[] = [];
    const scanRoots = ['src/content', 'src/components', 'src/explore/ui', 'src/list/crews'];
    const allow = new Set([
      'src/content/upl-glossary.ts',
      'src/content/workspaceProductLanguageGuard.test.ts',
    ]);
    const wireOk = /value="buddies"|'buddies'\s*\|/;

    for (const root of scanRoots) {
      const abs = join(process.cwd(), root);
      if (!existsSync(abs)) continue;
      for (const file of collectTs(abs)) {
        if (allow.has(file)) continue;
        if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue;
        const content = readFileSync(join(process.cwd(), file), 'utf8');
        if (/\bBuddies\b/.test(content)) {
          const lines = content.split('\n');
          const hit = lines.some((line) => /\bBuddies\b/.test(line) && !wireOk.test(line) && !line.trim().startsWith('//'));
          if (hit) violations.push(file);
        }
      }
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });
});