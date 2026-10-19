import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** MIG-COH-04 — canonical HTTP `/publishing` only (no `/operator` mount). */
describe('publishing HTTP canonical guard (COH-04)', () => {
  it('API index mounts /publishing only', () => {
    const index = read('apps/api/src/routes/index.ts');
    expect(index).toMatch(/apiRouter\.use\('\/publishing', publishingRouter\)/);
    expect(index).not.toMatch(/apiRouter\.use\('\/operator', publishingRouter\)/);
    expect(index).not.toMatch(/apiRouter\.use\('\/host'/);
  });

  it('FE clients call /publishing not /operator HTTP', () => {
    const org = read('src/api/domains/organisation.ts');
    const places = read('src/api/domains/places.ts');
    const activities = read('src/api/domains/activities.ts');
    expect(org).toMatch(/\/publishing\/requests/);
    expect(org).toMatch(/\/publishing\/team/);
    expect(org).not.toMatch(/['"`]\/operator\//);
    expect(places).toMatch(/\/publishing\/places/);
    expect(places).not.toMatch(/['"`]\/operator\/places/);
    expect(activities).toMatch(/\/publishing\/activities/);
    expect(activities).not.toMatch(/['"`]\/operator\/activities/);
  });

  it('organisation scope header is x-organisation-id only', () => {
    const tenantMw = read('apps/api/src/middleware/tenant.ts');
    const orgHeaders = read('src/api/orgHeaders.ts');
    expect(tenantMw).toMatch(/readHeader\(req, 'x-organisation-id'\)/);
    expect(tenantMw).not.toMatch(/x-tenant-id/);
    expect(orgHeaders).toMatch(/'x-organisation-id': organisationId/);
    expect(orgHeaders).not.toMatch(/x-tenant-id/);
  });

  it('SPA surface paths are /publishing/*', () => {
    const surface = read('src/config/surfacePaths.ts');
    expect(surface).toMatch(/PUBLISHING_OVERVIEW_PATH = '\/publishing\/overview'/);
    expect(surface).not.toMatch(/rewriteOperatorConsoleToPublishingPath/);
  });

  it('BWL wire-lexicon documents /publishing only (no /operator mount)', () => {
    const lexicon = read('packages/shared-types/src/wire-lexicon.ts');
    expect(lexicon).toMatch(/PUBLISHING_WORKSPACE: '\/publishing'/);
    expect(lexicon).not.toMatch(/PUBLISHING_WORKSPACE_CURRENT/);
    expect(lexicon).not.toMatch(/['"]\/operator['"]/);
  });
});
