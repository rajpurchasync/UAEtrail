import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** MIG-DESTINATION-GEO P9 — canonical HTTP `/destinations` only (no legacy `/areas` registrar). */
describe('destinations HTTP canonical guard (MIG-DESTINATION-GEO)', () => {
  it('destination registrar is the canonical public read', () => {
    const registrar = read('apps/api/src/routes/user/registerPublicDestinationRoutes.ts');
    expect(registrar).toMatch(/\/destinations/);
    expect(registrar).toMatch(/destination-public-read/);
  });

  it('legacy GET /api/areas registrar removed', () => {
    expect(existsSync(join(ROOT, 'apps/api/src/routes/user/registerPublicAreaRoutes.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'apps/api/src/lib/route-destination-alias.ts'))).toBe(false);
  });

  it('admin destinations CRUD mounted at /admin/destinations (areas compat)', () => {
    const registrar = read('apps/api/src/routes/admin/registerAdminAreaRoutes.ts');
    expect(registrar).toMatch(/registerAdminDestinationCrudOnPath/);
    expect(registrar).toMatch(/'\/destinations'/);
    expect(registrar).toMatch(/'\/areas'/);
  });

  it('catalog query schemas accept canonical destinationId + legacy aliases', () => {
    const schemas = read('apps/api/src/routes/user/schemas.ts');
    expect(schemas).toMatch(/placeCatalogQuerySchema[\s\S]*destinationId:/);
    expect(schemas).toMatch(/facilityCatalogQuerySchema[\s\S]*destinationId:/);
    expect(schemas).toMatch(/facilityCatalogQuerySchema[\s\S]*onSiteId:/);
  });
});