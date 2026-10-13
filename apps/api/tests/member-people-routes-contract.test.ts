import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (relativePath: string): string =>
  readFileSync(resolve(import.meta.dirname, '..', relativePath), 'utf8');

describe('member people browse API contract', () => {
  it('mounts social graph router at /social with people routes', () => {
    const routesIndex = read('src/routes/index.ts');
    expect(routesIndex).toMatch(/apiRouter\.use\('\/social', socialGraphRouter\)/);

    const registrar = read('src/routes/social/registerSocialPeopleRoutes.ts');
    expect(registrar).toMatch(/\/people'/);
    expect(registrar).toMatch(/\/people\/preview'/);
  });

  it('loads roster via member-people-engagement from people routes', () => {
    const registrar = read('src/routes/social/registerSocialPeopleRoutes.ts');
    expect(registrar).toMatch(/member-people-engagement/);
    expect(registrar).toMatch(/loadMemberPeopleNetworkRoster/);
    expect(registrar).toMatch(/loadMemberPeopleNetworkPreview/);
  });
});
