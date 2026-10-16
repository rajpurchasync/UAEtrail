import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('admin route registrars', () => {
  it('host applications live in dedicated registrar', () => {
    const admin = read('src/routes/admin.ts');
    const registrar = read('src/routes/admin/registerAdminHostApplicationRoutes.ts');
    expect(admin).toMatch(/registerAdminHostApplicationRoutes/);
    expect(admin).not.toMatch(/\/host-applications/);
    expect(registrar).toMatch(/\/host-applications/);
  });

  it('activity moderation mounts via dedicated registrar', () => {
    const admin = read('src/routes/admin.ts');
    const registrar = read('src/routes/admin/registerAdminActivityModerationRoutes.ts');
    expect(admin).toMatch(/registerAdminActivityModerationRoutes/);
    expect(admin).not.toMatch(/mountActivityRoutes/);
    expect(registrar).toMatch(/mountActivityRoutes/);
    expect(registrar).toMatch(/\/moderation/);
  });

  it('place CRUD lives in dedicated registrar', () => {
    const admin = read('src/routes/admin.ts');
    const registrar = read('src/routes/admin/registerAdminPlaceRoutes.ts');
    expect(admin).toMatch(/registerAdminPlaceRoutes/);
    expect(admin).not.toMatch(/adminPlaceCollectionPaths/);
    expect(registrar).toMatch(/listAdminPlacesPaged/);
    expect(registrar).toMatch(/\/places/);
  });

  it('facility CRUD lives in dedicated registrar (facilities collection)', () => {
    const admin = read('src/routes/admin.ts');
    const registrar = read('src/routes/admin/registerAdminFacilityRoutes.ts');
    expect(admin).toMatch(/registerAdminFacilityRoutes/);
    expect(registrar).toMatch(/listAdminFacilitiesPaged/);
    expect(registrar).toMatch(/\/facilities/);
  });

  it('dashboard metrics live in dedicated registrar', () => {
    const admin = read('src/routes/admin.ts');
    const registrar = read('src/routes/admin/registerAdminMetricsRoutes.ts');
    expect(admin).toMatch(/registerAdminMetricsRoutes/);
    expect(admin).not.toMatch(/countAdminMetrics/);
    expect(registrar).toMatch(/\/metrics/);
    expect(registrar).toMatch(/countAdminMetrics/);
  });

  it('user management lives in dedicated registrar', () => {
    const admin = read('src/routes/admin.ts');
    const registrar = read('src/routes/admin/registerAdminUserRoutes.ts');
    expect(admin).toMatch(/registerAdminUserRoutes/);
    expect(admin).not.toMatch(/userListQuerySchema/);
    expect(registrar).toMatch(/\/users/);
    expect(registrar).toMatch(/resolveAdminUserType/);
  });

  it('tenant oversight lives in dedicated registrar', () => {
    const admin = read('src/routes/admin.ts');
    const registrar = read('src/routes/admin/registerAdminTenantRoutes.ts');
    expect(admin).toMatch(/registerAdminTenantRoutes/);
    expect(admin).not.toMatch(/listAdminTenantsPaged/);
    expect(registrar).toMatch(/\/tenants/);
    expect(registrar).toMatch(/updateAdminTenantStatus/);
  });

  it('social groups live in dedicated registrar', () => {
    const admin = read('src/routes/admin.ts');
    const registrar = read('src/routes/admin/registerAdminGroupRoutes.ts');
    expect(admin).toMatch(/registerAdminGroupRoutes/);
    expect(admin).not.toMatch(/listAllSocialGroupsAdmin/);
    expect(registrar).toMatch(/\/groups/);
    expect(registrar).toMatch(/groupStatusSchema/);
  });

  it('admin.ts is a thin mount shell', () => {
    const admin = read('src/routes/admin.ts');
    expect(admin).not.toMatch(/adminRouter\.(get|post|patch|delete)\(/);
    expect(admin).toMatch(/registerAdminPlatformStaffRoutes/);
  });

  it('platform staff provisioning is master-gated', () => {
    const registrar = read('src/routes/admin/registerAdminPlatformStaffRoutes.ts');
    expect(registrar).toMatch(/requirePlatformMasterAdmin/);
    expect(registrar).toMatch(/\/platform-admins/);
  });
});
