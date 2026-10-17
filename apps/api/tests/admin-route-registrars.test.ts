import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('admin route registrars', () => {
  it('host applications live in dedicated registrar', () => {
    const admin = read('src/routes/admin.ts');
    const registrar = read('src/routes/admin/registerAdminHostApplicationRoutes.ts');
    const commands = read('src/services/admin-host-application-commands.ts');
    expect(admin).toMatch(/registerAdminHostApplicationRoutes/);
    expect(admin).not.toMatch(/\/host-applications/);
    expect(registrar).toMatch(/\/host-applications/);
    expect(registrar).toMatch(/admin-host-application-commands/);
    expect(registrar).not.toMatch(/approveHostApplicationAndProvisionTenant/);
    expect(commands).toMatch(/approveHostApplicationAndProvisionTenant/);
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
    const placeRead = read('src/services/admin-place-read.ts');
    expect(admin).toMatch(/registerAdminPlaceRoutes/);
    expect(admin).not.toMatch(/adminPlaceCollectionPaths/);
    expect(registrar).toMatch(/\/places/);
    expect(registrar).toMatch(/admin-place-read/);
    expect(registrar).not.toMatch(/listAdminPlacesPaged/);
    expect(placeRead).toMatch(/listAdminPlacesPaged/);
  });

  it('facility CRUD lives in dedicated registrar (facilities collection)', () => {
    const admin = read('src/routes/admin.ts');
    const registrar = read('src/routes/admin/registerAdminFacilityRoutes.ts');
    const facilityRead = read('src/services/admin-facility-read.ts');
    expect(admin).toMatch(/registerAdminFacilityRoutes/);
    expect(registrar).toMatch(/\/facilities/);
    expect(registrar).toMatch(/admin-facility-read/);
    expect(registrar).not.toMatch(/listAdminFacilitiesPaged/);
    expect(facilityRead).toMatch(/listAdminFacilitiesPaged/);
  });

  it('dashboard metrics live in dedicated registrar', () => {
    const admin = read('src/routes/admin.ts');
    const registrar = read('src/routes/admin/registerAdminMetricsRoutes.ts');
    const metricsRead = read('src/services/admin-metrics-read.ts');
    expect(admin).toMatch(/registerAdminMetricsRoutes/);
    expect(admin).not.toMatch(/countAdminMetrics/);
    expect(registrar).toMatch(/\/metrics/);
    expect(registrar).toMatch(/admin-metrics-read/);
    expect(registrar).not.toMatch(/countAdminMetrics/);
    expect(metricsRead).toMatch(/countAdminMetrics/);
  });

  it('user management lives in dedicated registrar', () => {
    const admin = read('src/routes/admin.ts');
    const registrar = read('src/routes/admin/registerAdminUserRoutes.ts');
    const userRead = read('src/services/admin-user-read.ts');
    expect(admin).toMatch(/registerAdminUserRoutes/);
    expect(admin).not.toMatch(/userListQuerySchema/);
    expect(registrar).toMatch(/\/users/);
    expect(registrar).toMatch(/admin-user-read/);
    expect(registrar).not.toMatch(/resolveAdminUserType/);
    expect(userRead).toMatch(/resolveAdminUserType/);
  });

  it('tenant oversight lives in dedicated registrar', () => {
    const admin = read('src/routes/admin.ts');
    const registrar = read('src/routes/admin/registerAdminTenantRoutes.ts');
    const tenantCommands = read('src/services/admin-tenant-commands.ts');
    expect(admin).toMatch(/registerAdminTenantRoutes/);
    expect(admin).not.toMatch(/listAdminTenantsPaged/);
    expect(registrar).toMatch(/\/tenants/);
    expect(registrar).toMatch(/admin-tenant-commands/);
    expect(registrar).not.toMatch(/updateAdminTenantStatus/);
    expect(tenantCommands).toMatch(/updateAdminTenantStatus/);
  });

  it('social groups live in dedicated registrar', () => {
    const admin = read('src/routes/admin.ts');
    const registrar = read('src/routes/admin/registerAdminGroupRoutes.ts');
    const groupRead = read('src/services/admin-group-read.ts');
    expect(admin).toMatch(/registerAdminGroupRoutes/);
    expect(admin).not.toMatch(/listAllSocialGroupsAdmin/);
    expect(registrar).toMatch(/\/groups/);
    expect(registrar).toMatch(/groupStatusSchema/);
    expect(registrar).toMatch(/admin-group-read/);
    expect(registrar).not.toMatch(/listAllSocialGroupsAdmin/);
    expect(groupRead).toMatch(/listAllSocialGroupsAdmin/);
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
