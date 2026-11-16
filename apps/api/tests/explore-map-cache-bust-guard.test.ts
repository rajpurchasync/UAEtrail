import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const SRC = join(ROOT, 'apps/api/src');

const ALLOW = new Set([
  'apps/api/src/lib/explore-map-cache.ts',
  'apps/api/src/lib/explore-map-cache-schedule.ts',
  'apps/api/src/services/side-effect-outbox-processor.ts',
]);

const walkTs = (dir: string, acc: string[] = []): string[] => {
  for (const ent of readdirSync(dir)) {
    const p = join(dir, ent);
    if (statSync(p).isDirectory()) {
      walkTs(p, acc);
    } else if (ent.endsWith('.ts') && !ent.endsWith('.d.ts')) {
      acc.push(p);
    }
  }
  return acc;
};

/**
 * Production writes bust the explore map via `scheduleExploreMapCacheInvalidation` (outbox when enabled).
 * Direct `invalidateExploreMapCache` stays on the cache module, schedule fallback, processor, tests, and seeds.
 * @see docs/SYSTEM_COHERENCE.md §8.8 MIG-COH-08
 */
describe('explore map cache bust guard (COH-08)', () => {
  it('production src does not call invalidateExploreMapCache outside the allowlist', () => {
    const violations: string[] = [];
    for (const file of walkTs(SRC)) {
      const rel = file.replace(/\\/g, '/').replace(`${ROOT.replace(/\\/g, '/')}/`, '');
      if (ALLOW.has(rel)) continue;
      const text = readFileSync(file, 'utf8');
      if (text.includes('invalidateExploreMapCache')) {
        violations.push(rel);
      }
    }
    expect(violations).toEqual([]);
  });

  it('public map registrar does not attach optionalAuth for viewer enrich', () => {
    const registrar = readFileSync(
      join(ROOT, 'apps/api/src/routes/user/registerPublicPlaceRoutes.ts'),
      'utf8'
    );
    const mapBlock = registrar.slice(
      registrar.indexOf("router.get('/explore/map'"),
      registrar.indexOf("registerPlaceAlias(router, 'get', '/places'")
    );
    expect(mapBlock).not.toMatch(/optionalAuth/);
    expect(mapBlock).toMatch(/viewerUserId:\s*null/);
  });

  it('overlay registrar mounts GET /me/discover/overlay', () => {
    const registrar = readFileSync(
      join(ROOT, 'apps/api/src/routes/user/registerMeDiscoverOverlayRoutes.ts'),
      'utf8'
    );
    expect(registrar).toMatch(/\/me\/discover\/overlay/);
    expect(registrar).toMatch(/loadExploreMapOverlayForViewer/);
  });
});
