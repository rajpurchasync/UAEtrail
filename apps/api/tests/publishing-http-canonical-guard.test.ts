import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** Operator workspace HTTP — single mount `/workspace`. */
describe('operator workspace HTTP canonical guard (COH-04)', () => {
  it('API index mounts /workspace only (no /publishing or /operator HTTP)', () => {
    const index = read('apps/api/src/routes/index.ts');
    expect(index).toMatch(/apiRouter\.use\('\/workspace', workspaceRouter\)/);
    expect(index).not.toMatch(/apiRouter\.use\('\/publishing'/);
    expect(index).not.toMatch(/apiRouter\.use\('\/operator', workspaceRouter\)/);
    expect(index).not.toMatch(/apiRouter\.use\('\/host'/);
  });

  it('FE clients call /workspace only from operatorWorkspace domain module', () => {
    const workspace = read('src/api/domains/operatorWorkspace.ts');
    const org = read('src/api/domains/operatorPublic.ts');
    const places = read('src/api/domains/places.ts');
    const activities = read('src/api/domains/activities.ts');
    expect(workspace).toMatch(/\/workspace\/requests/);
    expect(workspace).toMatch(/\/workspace\/team/);
    expect(workspace).toMatch(/\/workspace\/places/);
    expect(workspace).toMatch(/\/workspace\/activities/);
    expect(workspace).toMatch(/\/workspace\/shop-profile/);
    expect(workspace).not.toMatch(/['"`]\/publishing\//);
    expect(workspace).not.toMatch(/['"`]\/operator\//);
    expect(org).not.toMatch(/\/workspace\//);
    expect(places).not.toMatch(/\/workspace\//);
    expect(activities).not.toMatch(/\/workspace\/activities/);
  });

  it('tenant scope header is x-tenant-id only', () => {
    const tenantMw = read('apps/api/src/middleware/tenant.ts');
    const tenantHeaders = read('src/api/tenantScopeHeaders.ts');
    expect(tenantMw).toMatch(/readHeader\(req, 'x-tenant-id'\)/);
    expect(tenantMw).not.toMatch(/x-organisation-id/);
    expect(tenantHeaders).toMatch(/'x-tenant-id': tenantId/);
    expect(tenantHeaders).not.toMatch(/x-organisation-id/);
  });

  it('SPA surface paths are /operator/*', () => {
    const surface = read('src/config/surfacePaths.ts');
    expect(surface).toMatch(/OPERATOR_OVERVIEW_PATH = '\/operator\/overview'/);
    expect(surface).not.toMatch(/rewriteOperatorConsoleToPublishingPath/);
  });

  it('BWL wire-lexicon documents HTTP /workspace and SPA /operator', () => {
    const lexicon = read('packages/shared-types/src/wire-lexicon.ts');
    expect(lexicon).toMatch(/OPERATOR_WORKSPACE: '\/workspace'/);
    expect(lexicon).toMatch(/OPERATOR_CONSOLE_PREFIX: '\/operator'/);
    expect(lexicon).not.toMatch(/PUBLISHING_WORKSPACE:/);
  });
});