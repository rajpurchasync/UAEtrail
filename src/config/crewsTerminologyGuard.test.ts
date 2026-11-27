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
  { pattern: /\bbuddiesDiscoverSegment\b/, label: 'buddiesDiscoverSegment (use CrewBrowseTab)' },
  { pattern: /\bBUDDIES_SEGMENT_URL_PARAM\b/, label: 'BUDDIES_SEGMENT_URL_PARAM (use PEOPLE_LIST_TAB_URL_PARAM)' },
  { pattern: /\bapplyBuddiesDiscoverSegment\b/, label: 'applyBuddiesDiscoverSegment (use applyCrewBrowseLane)' },
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

  it('CREWS-02: explore browse sync does not serialize buddies= params', () => {
    const sync = readFileSync(join(process.cwd(), 'src/explore/exploreBrowseUrlSync.ts'), 'utf8');
    expect(sync).not.toMatch(/params\.set\('buddies'/);
    expect(sync).not.toMatch(/stripRetiredPeopleListTabParams/);
  });

  it('CREWS-03: explore URL hydrate has no socialTab shim', () => {
    const hydrate = readFileSync(join(process.cwd(), 'src/explore/exploreBrowseUrlHydrate.ts'), 'utf8');
    expect(hydrate).not.toMatch(/params\.get\('socialTab'\)/);
  });

  it('CREWS-04: list taxonomy has no Buddies category label', () => {
    const taxonomy = readFileSync(join(process.cwd(), 'src/list/browse/browseListTaxonomy.ts'), 'utf8');
    expect(taxonomy).not.toMatch(/label:\s*['"]Buddies['"]/);
  });

  it('CREWS-05: people list URL module has no INBOUND_BUDDIES alias', () => {
    const peopleUrl = readFileSync(join(process.cwd(), 'src/list/browse/peopleListBrowseUrl.ts'), 'utf8');
    expect(peopleUrl).not.toMatch(/INBOUND_BUDDIES_LIST_TAB_PARAM/);
    const stats = readFileSync(join(process.cwd(), 'src/list/crews/findCrewPeopleFacets.ts'), 'utf8');
    expect(stats).not.toMatch(/buddies: 'Buddies'/);
  });

  it('CREWS-07: no standalone BUDDIES_PATH constant in surface paths', () => {
    const surface = readFileSync(join(process.cwd(), 'src/config/surfacePaths.ts'), 'utf8');
    expect(surface).not.toMatch(/BUDDIES_PATH/);
  });

  it('CREWS-07: activity detail emits tab=crew (not tab=buddies)', () => {
    const violations: string[] = [];
    const scanRoots = ['src/list', 'src/explore', 'src/activity', 'src/pages'];
    const allowLegacyParse = /parseActivityDetailTabParam|legacy.*buddies|`\?tab=buddies`/;

    for (const root of scanRoots) {
      const abs = join(process.cwd(), root);
      if (!existsSync(abs)) continue;
      for (const file of collectTs(abs)) {
        if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue;
        const content = readFileSync(join(process.cwd(), file), 'utf8');
        if (!/tab=buddies/.test(content)) continue;
        if (allowLegacyParse.test(content)) continue;
        violations.push(file);
      }
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('CREWS-06: no Buddies product string in consumer content/components', () => {
    const violations: string[] = [];
    const scanRoots = ['src/content', 'src/components', 'src/explore/ui', 'src/list/crews', 'src/pages', 'src/activity'];
    const allow = new Set([
      'src/content/upl-glossary.ts',
      'src/content/workspaceProductLanguageGuard.test.ts',
    ]);
    const wireOk = /value="friends"/;

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