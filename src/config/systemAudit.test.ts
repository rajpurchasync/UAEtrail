import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

describe('CTO system audit (W0)', () => {
  it('baseline and route graph artifacts exist', () => {
    expect(existsSync(join(ROOT, 'scripts/system-audit-baseline.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/system-audit-routes.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/cto-audit-pillars.json'))).toBe(true);
  });

  it('declares 12 audit pillars', () => {
    const pillars = JSON.parse(
      readFileSync(join(ROOT, 'scripts/cto-audit-pillars.json'), 'utf8')
    );
    expect(pillars.pillars).toHaveLength(12);
    expect(pillars.greenfieldPrinciples?.length).toBeGreaterThan(5);
  });

  it('collection manifest is fully scanned', () => {
    const collections = readFileSync(join(ROOT, 'apps/api/src/lib/collections.ts'), 'utf8');
    const defined = (collections.match(/^\s+[A-Z_]+:/gm) ?? []).length;
    const baseline = JSON.parse(
      readFileSync(join(ROOT, 'scripts/system-audit-baseline.json'), 'utf8')
    );
    expect(baseline.summary.mongoCollectionsDefined).toBe(defined);
  });
});
