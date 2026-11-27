import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/**
 * MIG-COH-03 — canonical HTTP `/me/pro-application` and `/admin/pro-applications`;
 * legacy host-application paths only via route-pro-application-alias.
 */
describe('pro-application HTTP canonical guard (COH-03)', () => {
  it('member registrar registers canonical /me/pro-application', () => {
    const registrar = read('apps/api/src/routes/user/registerHostApplicationRoutes.ts');
    expect(registrar).toMatch(/registerProApplicationAlias\([\s\S]*'\/me\/pro-application'/);
    expect(registrar).not.toMatch(/registerProApplicationAlias\([^)]*'\/me\/host-application'/);
  });

  it('route-pro-application-alias maps /me/pro-application → legacy /me/host-application (not the inverse)', () => {
    const alias = read('apps/api/src/lib/route-pro-application-alias.ts');
    expect(alias).toMatch(/startsWith\('\/me\/pro-application'\)/);
    expect(alias).toMatch(/replace\(\/\^\\\/me\\\/pro-application/);
    expect(alias).not.toMatch(/startsWith\('\/me\/host-application'\)/);
  });

  it('admin registrar mounts /pro-applications as canonical', () => {
    const admin = read('apps/api/src/routes/admin/registerAdminHostApplicationRoutes.ts');
    expect(admin).toMatch(/registerProApplicationAlias\([\s\S]*'\/pro-applications'/);
    expect(admin).not.toMatch(/registerProApplicationAlias\([^)]*'\/host-applications'/);
  });

  it('FE clients call canonical Pro-application HTTP', () => {
    const org = read('src/api/domains/operatorPublic.ts');
    const admin = read('src/api/domains/admin.ts');
    expect(org).toMatch(/\/me\/pro-application/);
    expect(org).not.toMatch(/\/me\/host-application/);
    expect(admin).toMatch(/\/admin\/pro-applications/);
    expect(admin).not.toMatch(/\/admin\/host-applications/);
  });
});
