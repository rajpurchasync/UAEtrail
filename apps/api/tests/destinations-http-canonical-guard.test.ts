import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** MIG-DESTINATION-GEO P9 — canonical HTTP `/destinations`; legacy `/areas` read alias only. */
describe('destinations HTTP canonical guard (MIG-DESTINATION-GEO)', () => {
  it('destination registrar is the canonical public read', () => {
    const registrar = read('apps/api/src/routes/user/registerPublicDestinationRoutes.ts');
    expect(registrar).toMatch(/\/destinations/);
    expect(registrar).toMatch(/destination-public-read/);
  });

  it('legacy areas registrar delegates to destination read + Deprecation headers', () => {
    const legacy = read('apps/api/src/routes/user/registerPublicAreaRoutes.ts');
    expect(legacy).toMatch(/destination-public-read/);
    expect(legacy).toMatch(/attachLegacyAreasApiDeprecationHeaders/);
    expect(legacy).not.toMatch(/area-public-read/);
  });

  it('route-destination-alias sets Deprecation + Link successor', () => {
    const alias = read('apps/api/src/lib/route-destination-alias.ts');
    expect(alias).toMatch(/Deprecation/);
    expect(alias).toMatch(/successor-version/);
  });
});