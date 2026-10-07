import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src');
const SCAN_DIRS = ['pages', 'components', 'utils', 'hooks', 'content'];

const collectFiles = (dir: string, acc: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(process.cwd(), full).replace(/\\/g, '/');
    const st = statSync(full);
    if (st.isDirectory()) collectFiles(full, acc);
    else if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !entry.endsWith('.test.ts')) acc.push(rel);
  }
  return acc;
};

describe('routingCatalog adoption', () => {
  it('app surfaces do not import utils/exploreRouting shim', () => {
    const violations: string[] = [];
    for (const sub of SCAN_DIRS) {
      const base = join(ROOT, sub);
      for (const file of collectFiles(base)) {
        const content = readFileSync(join(process.cwd(), file), 'utf8');
        if (/from ['"][^'"]*utils\/exploreRouting['"]/.test(content)) {
          violations.push(file);
        }
      }
    }
    if (violations.length) {
      expect(violations).toEqual(
        violations.map((f) => `${f}: import from config/routingCatalog instead of utils/exploreRouting`)
      );
    } else {
      expect(violations).toEqual([]);
    }
  });

  it('pages and components import organisation paths via routingCatalog', () => {
    const violations: string[] = [];
    for (const sub of ['pages', 'components'] as const) {
      for (const file of collectFiles(join(ROOT, sub))) {
        const content = readFileSync(join(process.cwd(), file), 'utf8');
        if (/from ['"][^'"]*member\/organisationPaths['"]/.test(content)) {
          violations.push(file);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('pages and components do not import path constants from config/platform', () => {
    const violations: string[] = [];
    const pathSymbols = /EXPLORE_MAP_PATH|joinAuthPath|PRO_MEMBERSHIP_PATH|TRIPS_PATH/;
    for (const sub of ['pages', 'components'] as const) {
      for (const file of collectFiles(join(ROOT, sub))) {
        if (file.includes('routingCatalog')) continue;
        const content = readFileSync(join(process.cwd(), file), 'utf8');
        const platformImport = content.match(
          /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"][^'"]*config\/platform['"]/
        );
        if (!platformImport) continue;
        if (pathSymbols.test(platformImport[1])) {
          violations.push(file);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
