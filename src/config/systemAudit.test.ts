import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

describe('CTO system audit (W0)', () => {
  it('baseline and route graph artifacts exist', () => {
    expect(existsSync(join(ROOT, 'scripts/governance/system-audit-baseline.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/governance/system-audit-routes.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/governance/cto-audit-pillars.json'))).toBe(true);
  });

  it('declares 12 audit pillars', () => {
    const pillars = JSON.parse(
      readFileSync(join(ROOT, 'scripts/governance/cto-audit-pillars.json'), 'utf8')
    );
    expect(pillars.pillars).toHaveLength(12);
    expect(pillars.greenfieldPrinciples?.length).toBeGreaterThan(5);
  });

  it('collection manifest is fully scanned', () => {
    const collections = readFileSync(join(ROOT, 'apps/api/src/lib/collections.ts'), 'utf8');
    const defined = (collections.match(/^\s+[A-Z_]+:/gm) ?? []).length;
    const baseline = JSON.parse(
      readFileSync(join(ROOT, 'scripts/governance/system-audit-baseline.json'), 'utf8')
    );
    expect(baseline.summary.mongoCollectionsDefined).toBe(defined);
  });

  it('route graph includes mounted top-level routers and matches baseline count', () => {
    const baseline = JSON.parse(
      readFileSync(join(ROOT, 'scripts/governance/system-audit-baseline.json'), 'utf8')
    );
    const routes = JSON.parse(
      readFileSync(join(ROOT, 'scripts/governance/system-audit-routes.json'), 'utf8')
    ) as { endpoints: { method: string; path: string }[] };

    expect(routes.endpoints.length).toBe(baseline.summary.apiRouteEndpointsParsed);
    expect(baseline.summary.apiRouteEndpointsParsed).toBeGreaterThanOrEqual(150);
    expect(baseline.summary.routeRegistrarsWithDirectWrites).toBe(0);

    const keys = new Set(routes.endpoints.map((e) => `${e.method} ${e.path}`));
    expect(keys.has('POST /auth/login')).toBe(true);
    expect(keys.has('POST /activities/:id/rsvp')).toBe(true);
    expect(keys.has('GET /explore/map')).toBe(true);
    expect(keys.has('GET /me/discover/overlay')).toBe(true);
  });
});
