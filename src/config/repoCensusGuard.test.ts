import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('repoCensusGuard (P0 census parity)', () => {
  it('CENSUS-01: spaRouteElements matches system-audit (AppRoutes.tsx)', () => {
    const census = JSON.parse(read('scripts/governance/repo-census-baseline.json')) as {
      spaRouteElements?: number;
    };
    const audit = JSON.parse(read('scripts/governance/system-audit-baseline.json')) as {
      summary?: { spaRouteElements?: number };
    };
    expect(census.spaRouteElements).toBeGreaterThan(100);
    expect(census.spaRouteElements).toBe(audit.summary?.spaRouteElements);
  });

  it('CENSUS-02: repo-census counts routes from AppRoutes.tsx', () => {
    const script = read('scripts/dev/repo-census.mjs');
    expect(script).toMatch(/join\(root, 'src\/routing\/AppRoutes\.tsx'\)/);
  });
});