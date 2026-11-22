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

  it('FE clients call /publishing only from publishingWorkspace domain module', () => {
    const workspace = read('src/api/domains/publishingWorkspace.ts');
    const org = read('src/api/domains/organisation.ts');
    const places = read('src/api/domains/places.ts');
    const activities = read('src/api/domains/activities.ts');
    expect(workspace).toMatch(/\/publishing\/requests/);
    expect(workspace).toMatch(/\/publishing\/team/);
    expect(workspace).toMatch(/\/publishing\/places/);
    expect(workspace).toMatch(/\/publishing\/activities/);
    expect(workspace).not.toMatch(/['"`]\/operator\//);
    expect(org).not.toMatch(/\/publishing\//);
    expect(places).not.toMatch(/\/publishing\//);
    expect(activities).not.toMatch(/\/publishing\//);
  });

  it('organisation scope header is x-organisation-id only', () => {
    const tenantMw = read('apps/api/src/middleware/tenant.ts');
    const orgHeaders = read('src/api/orgHeaders.ts');
    expect(tenantMw).toMatch(/readHeader\(req, 'x-organisation-id'\)/);
    expect(tenantMw).not.toMatch(/x-tenant-id/);
    expect(orgHeaders).toMatch(/'x-organisation-id': organisationId/);
    expect(orgHeaders).not.toMatch(/x-tenant-id/);
  });

  it('SPA surface paths are /operator/*', () => {
    const surface = read('src/config/surfacePaths.ts');
    expect(surface).toMatch(/OPERATOR_OVERVIEW_PATH = '\/operator\/overview'/);
    expect(surface).not.toMatch(/rewriteOperatorConsoleToPublishingPath/);
  });

  it('BWL wire-lexicon documents HTTP /publishing and SPA /operator', () => {
    const lexicon = read('packages/shared-types/src/wire-lexicon.ts');
    expect(lexicon).toMatch(/PUBLISHING_WORKSPACE: '\/publishing'/);
    expect(lexicon).toMatch(/OPERATOR_CONSOLE_PREFIX: '\/operator'/);
    expect(lexicon).not.toMatch(/PUBLISHING_WORKSPACE_CURRENT/);
  });
});
