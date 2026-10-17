import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** MIG-COH-04 — canonical HTTP `/publishing`; `/operator` mount is alias only. */
describe('publishing HTTP canonical guard (COH-04)', () => {
  it('API index mounts /publishing then /operator alias', () => {
    const index = read('apps/api/src/routes/index.ts');
    const publishingAt = index.indexOf("apiRouter.use('/publishing', operatorRouter)");
    const operatorAt = index.indexOf("apiRouter.use('/operator', operatorRouter)");
    expect(publishingAt).toBeGreaterThanOrEqual(0);
    expect(operatorAt).toBeGreaterThan(publishingAt);
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

  it('SPA surface paths are /publishing/*', () => {
    const surface = read('src/config/surfacePaths.ts');
    expect(surface).toMatch(/OPERATOR_OVERVIEW_PATH = '\/publishing\/overview'/);
    expect(surface).toMatch(/rewriteOperatorConsoleToPublishingPath/);
  });
});
