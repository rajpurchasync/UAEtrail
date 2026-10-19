import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');
const exists = (rel: string) => existsSync(join(ROOT, rel));

type CatalogSurfaceSpec = {
  id: string;
  publicRegistrar: string;
  memberRegistrar: string;
  adminRegistrar: string;
  publicPathNeedle: RegExp;
  memberPathNeedle: RegExp;
  adminPathNeedle: RegExp;
};

const CATALOG_SURFACES: CatalogSurfaceSpec[] = [
  {
    id: 'places',
    publicRegistrar: 'apps/api/src/routes/user/registerPublicPlaceRoutes.ts',
    memberRegistrar: 'apps/api/src/routes/user/registerMeSubmittedPlaceRoutes.ts',
    adminRegistrar: 'apps/api/src/routes/admin/registerAdminPlaceRoutes.ts',
    publicPathNeedle: /\/places\/:id|['"]\/places\/catalog['"]/,
    memberPathNeedle: /\/me\/places/,
    adminPathNeedle: /adminPlaceCollectionPaths|['"]\/places['"]/,
  },
  {
    id: 'facilities',
    publicRegistrar: 'apps/api/src/routes/user/registerPublicFacilityRoutes.ts',
    memberRegistrar: 'apps/api/src/routes/user/registerMeFacilityRoutes.ts',
    adminRegistrar: 'apps/api/src/routes/admin/registerAdminFacilityRoutes.ts',
    publicPathNeedle: /\/facilities\/:id|['"]\/facilities\/catalog['"]/,
    memberPathNeedle: /\/me\/facilities/,
    adminPathNeedle: /\/facilities/,
  },
];

const MONOLITH_ROUTE_FILES = [
  'apps/api/src/routes/user/registerPlaceRoutes.ts',
  'apps/api/src/routes/user/registerFacilityRoutes.ts',
  'apps/api/src/routes/catalog/registerCatalogRoutes.ts',
];

/**
 * Catalog HTTP must stay surface-first (public / me / admin), not profile-first monoliths.
 * @see docs/SYSTEM_COHERENCE.md §5.1 · §8.4.9
 */
describe('catalog HTTP surface guard', () => {
  it('places and facilities each use Public + Me + Admin registrars (manifest-aligned)', () => {
    const violations: string[] = [];
    for (const spec of CATALOG_SURFACES) {
      for (const file of [spec.publicRegistrar, spec.memberRegistrar, spec.adminRegistrar]) {
        if (!exists(file)) violations.push(`${spec.id}: missing ${file}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('registrars mount expected path families (not a shared POST /places|facilities)', () => {
    const violations: string[] = [];
    for (const spec of CATALOG_SURFACES) {
      const pub = read(spec.publicRegistrar);
      const me = read(spec.memberRegistrar);
      const admin = read(spec.adminRegistrar);
      if (!spec.publicPathNeedle.test(pub)) {
        violations.push(`${spec.id}: public registrar missing public read paths`);
      }
      if (!spec.memberPathNeedle.test(me)) {
        violations.push(`${spec.id}: member registrar missing /me/* submit paths`);
      }
      if (!spec.adminPathNeedle.test(admin)) {
        violations.push(`${spec.id}: admin registrar missing /admin catalog paths`);
      }
      if (/resolveMemberStatus|getMemberStatus/.test(me)) {
        violations.push(`${spec.id}: member submit must not resolve publish status for authz`);
      }
      if (/resolveMemberStatus|getMemberStatus/.test(admin)) {
        violations.push(`${spec.id}: admin CRUD must not resolve publish status for authz`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('user.ts mounts public catalog reads before requireAuth and member submit after', () => {
    const user = read('apps/api/src/routes/user.ts');
    const publicCompose = read('apps/api/src/routes/user/composeUserPublicRoutes.ts');
    const memberCompose = read('apps/api/src/routes/user/composeUserMemberRoutes.ts');
    const authIdx = user.indexOf('userRouter.use(requireAuth');
    const publicIdx = user.indexOf('composeUserPublicRoutes(userRouter');
    const memberIdx = user.indexOf('composeUserMemberRoutes(userRouter');
    const pubPlaceIdx = publicCompose.indexOf('registerPublicPlaceRoutes(userRouter');
    const pubFacilityIdx = publicCompose.indexOf('registerPublicFacilityRoutes(userRouter');
    const mePlaceIdx = memberCompose.indexOf('registerMeSubmittedPlaceRoutes(userRouter');
    const meFacilityIdx = memberCompose.indexOf('registerMeFacilityRoutes(userRouter');
    expect(authIdx).toBeGreaterThan(-1);
    expect(publicIdx).toBeLessThan(authIdx);
    expect(memberIdx).toBeGreaterThan(authIdx);
    expect(pubPlaceIdx).toBeGreaterThan(-1);
    expect(pubFacilityIdx).toBeGreaterThan(-1);
    expect(mePlaceIdx).toBeGreaterThan(-1);
    expect(meFacilityIdx).toBeGreaterThan(-1);
  });

  it('admin.ts mounts facility and place CRUD via dedicated registrars only', () => {
    const admin = read('apps/api/src/routes/admin.ts');
    expect(admin).toMatch(/registerAdminPlaceRoutes/);
    expect(admin).toMatch(/registerAdminFacilityRoutes/);
    expect(admin).toMatch(/requireRole\(\[UserRole\.PLATFORM_ADMIN\]\)/);
    expect(admin).not.toMatch(/adminRouter\.(get|post|patch|delete)\(['"]\/(places|facilities)/);
  });

  it('does not introduce profile-first catalog monolith route files', () => {
    const present = MONOLITH_ROUTE_FILES.filter((f) => exists(f));
    expect(present).toEqual([]);
  });

  it('member place submit rejects facilityKind (facilities use POST /me/facilities)', () => {
    const mePlaces = read('apps/api/src/routes/user/registerMeSubmittedPlaceRoutes.ts');
    expect(mePlaces).toMatch(/Use POST \/me\/facilities/);
    expect(mePlaces).not.toMatch(/upsertFacilityFromLocationRow/);
  });

  it('public catalog registrars do not mount member/admin catalog submit', () => {
    const violations: string[] = [];
    const catalogSubmit = /buildPlaceSubmitPayload|buildFacilitySubmitInput|createFacilityRecord|createAdminFacility/;
    const memberSubmitPath =
      /registerPlaceAlias\(\s*router,\s*['"]post['"],\s*['"]\/me\/(places|locations)['"]|router\.post\(\s*['"]\/me\/facilities/;
    for (const file of CATALOG_SURFACES.map((s) => s.publicRegistrar)) {
      const content = read(file);
      if (catalogSubmit.test(content)) {
        violations.push(`${file}: must not call catalog submit builders/stores`);
      }
      if (memberSubmitPath.test(content)) {
        violations.push(`${file}: must not POST /me/places or /me/facilities`);
      }
    }
    expect(violations).toEqual([]);
  });
});
