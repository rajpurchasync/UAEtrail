import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
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
  'src/list/peopleListBrowseUrl.ts',
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
    const sync = readFileSync(join(process.cwd(), 'src/explore/exploreBrowseUrlSync.ts'), 'utf8');
    expect(sync).toMatch(/INBOUND_BUDDIES_LIST_TAB_PARAM/);
    expect(sync).toMatch(/params\.delete\(INBOUND_BUDDIES_LIST_TAB_PARAM\)/);
    expect(sync).toMatch(/PEOPLE_LIST_TAB_URL_PARAM/);
    expect(sync).not.toMatch(/params\.set\('buddies'/);
  });

  it('CREWS-03: single crews tab read path (productUrlInbound)', () => {
    const inbound = readFileSync(join(process.cwd(), 'src/routing/productUrlInbound.ts'), 'utf8');
    expect(inbound).toMatch(/readPeopleCrewsTabParam/);
    expect(readFileSync(join(process.cwd(), 'src/list/peopleListBrowseUrl.ts'), 'utf8')).toMatch(
      /readPeopleCrewsTabParam/
    );
    const hydrate = readFileSync(join(process.cwd(), 'src/explore/exploreBrowseUrlHydrate.ts'), 'utf8');
    expect(hydrate).toMatch(/parseExplorePeopleBrowseTab/);
    expect(hydrate).not.toMatch(/params\.get\('socialTab'\)/);
  });

  it('CREWS-04: list taxonomy people category uses Crews label', () => {
    const taxonomy = readFileSync(join(process.cwd(), 'src/list/browseListTaxonomy.ts'), 'utf8');
    expect(taxonomy).toMatch(/PRODUCT_CREWS_TAB_LABEL/);
    expect(taxonomy).not.toMatch(/label:\s*['"]Buddies['"]/);
  });
});