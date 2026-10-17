import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const API_SRC = join(process.cwd(), 'src');
const WIRE_LEXICON = join(process.cwd(), '../../packages/shared-types/src/wire-lexicon.ts');

const collectTsUnder = (dir: string, root = dir): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules') continue;
      out.push(...collectTsUnder(full, root));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      out.push(relative(root, full).replace(/\\/g, '/'));
    }
  }
  return out;
};

/** Routes must not adopt UPL marketing strings as new path segments. */
const UPL_BANNED_IN_ROUTE_PATHS = [/['"`]\/find-your-crew/i, /['"`]\/looking-for-company/i];

describe('terminology leak guard (API)', () => {
  it('wire-lexicon module exists (BWL)', () => {
    expect(existsSync(WIRE_LEXICON)).toBe(true);
    expect(readFileSync(WIRE_LEXICON, 'utf8')).toMatch(/BWL_COLLECTIONS/);
  });

  it('route registrars do not use UPL phrases in URL paths', () => {
    const violations: string[] = [];
    const routesDir = join(API_SRC, 'routes');
    for (const file of collectTsUnder(routesDir)) {
      const content = readFileSync(join(routesDir, file), 'utf8');
      for (const pattern of UPL_BANNED_IN_ROUTE_PATHS) {
        if (pattern.test(content)) {
          violations.push(`routes/${file}: UPL string in route path`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
