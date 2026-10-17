import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/**
 * MIG-COH-02 — canonical HTTP `/places`; legacy `/locations` only via route-place-alias.
 */
describe('places HTTP canonical guard (COH-02)', () => {
  it('public place registrar registers canonical /places paths', () => {
    const registrar = read('apps/api/src/routes/user/registerPublicPlaceRoutes.ts');
    expect(registrar).toMatch(/registerPlaceAlias\([\s\S]*'\/places'/);
    expect(registrar).not.toMatch(/registerPlaceAlias\([^)]*'\/locations'/);
  });

  it('route-place-alias maps /places → legacy /locations (not the inverse)', () => {
    const alias = read('apps/api/src/lib/route-place-alias.ts');
    expect(alias).toMatch(/startsWith\('\/places'\)/);
    expect(alias).toMatch(/replace\(\/\^\\\/places/);
    expect(alias).not.toMatch(/startsWith\('\/locations'\)/);
  });

  it('admin place CRUD mounts /admin/places only', () => {
    const admin = read('apps/api/src/routes/admin/registerAdminPlaceRoutes.ts');
    expect(admin).toMatch(/adminPlaceCollectionPaths = \['\/places'\]/);
    expect(admin).not.toMatch(/'\/locations'/);
  });
});
