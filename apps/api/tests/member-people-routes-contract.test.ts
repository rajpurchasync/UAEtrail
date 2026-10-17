import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (relativePath: string): string =>
  readFileSync(resolve(import.meta.dirname, '..', relativePath), 'utf8');

describe('member people browse API contract', () => {
  it('does not mount legacy /social people graph router', () => {
    const routesIndex = read('src/routes/index.ts');
    expect(routesIndex).not.toMatch(/apiRouter\.use\('\/social', socialGraphRouter\)/);
  });

  it('registers people network reads under /me/member-discovery/network', () => {
    const registrar = read('src/routes/user/registerMemberDiscoveryRoutes.ts');
    expect(registrar).toMatch(/\/me\/member-discovery\/network'/);
    expect(registrar).toMatch(/\/me\/member-discovery\/network\/preview'/);
    expect(registrar).toMatch(/member-people-engagement/);
    expect(registrar).toMatch(/loadMemberPeopleNetworkRoster/);
    expect(registrar).toMatch(/loadMemberPeopleNetworkPreview/);
  });
});
