import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/**
 * MIG-COH-02 — canonical HTTP `/places`; legacy `/locations` → 410 via retired-place-location-paths.
 */
describe('places HTTP canonical guard (COH-02)', () => {
  it('route-place-alias shim module is removed (W2)', () => {
    expect(existsSync(join(ROOT, 'apps/api/src/lib/route-place-alias.ts'))).toBe(false);
  });

  it('public place registrar registers canonical /places paths', () => {
    const registrar = read('apps/api/src/routes/user/registerPublicPlaceRoutes.ts');
    expect(registrar).toMatch(/router\.get\([\s\S]*'\/places'/);
    expect(registrar).not.toMatch(/registerPlaceAlias/);
    expect(registrar).not.toMatch(/'\/locations'/);
  });

  it('retired-place-location-paths maps legacy /locations → 410 (not live handlers)', () => {
    const retired = read('apps/api/src/lib/retired-place-location-paths.ts');
    expect(retired).toMatch(/\/locations/);
    expect(retired).toMatch(/\/me\/locations/);
    expect(retired).toMatch(/status\(410\)/);
    expect(retired).toMatch(/Deprecation/);
    expect(retired).not.toMatch(/registerPlaceAlias/);
  });

  it('public place registrar mounts retired location paths', () => {
    const registrar = read('apps/api/src/routes/user/registerPublicPlaceRoutes.ts');
    expect(registrar).toMatch(/mountRetiredPlaceLocationPaths/);
  });

  it('admin place CRUD mounts /admin/places only', () => {
    const admin = read('apps/api/src/routes/admin/registerAdminPlaceRoutes.ts');
    expect(admin).toMatch(/adminPlaceCollectionPaths = \['\/places'\]/);
    expect(admin).not.toMatch(/'\/locations'/);
  });
});