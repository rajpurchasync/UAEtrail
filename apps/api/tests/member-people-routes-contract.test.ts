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

  it('uses Redis-backed social adjacency read cache when REDIS_URL is set', () => {
    const cache = read('src/lib/social-adjacency-read-cache.ts');
    expect(cache).toMatch(/social:adj:buddies:/);
    expect(cache).toMatch(/getRedisClient/);
  });

  it('enables per-request scope memo middleware on the API app', () => {
    const appSource = read('src/app.ts');
    expect(appSource).toMatch(/requestScopeMiddleware/);
  });

  it('registers member profile social graph under /member/:userId/social-graph', () => {
    const registrar = read('src/routes/user/registerPublicMemberRoutes.ts');
    expect(registrar).toMatch(/\/member\/:userId\/social-graph/);
    expect(registrar).toMatch(/loadMemberProfileSocialGraph/);
    expect(registrar).toMatch(/parseMemberProfileSocialGraphParts/);
    expect(registrar).toMatch(/parseMemberProfilePageIncludes/);
    expect(registrar).toMatch(/\bincludes\b/);
    const profileRead = read('src/services/member-public-read.ts');
    expect(profileRead).toMatch(/preloadedUser/);
    expect(profileRead).toMatch(/preloadedTarget/);
  });

  it('registers people network reads under /me/member-discovery/network', () => {
    const registrar = read('src/routes/user/registerMemberDiscoveryRoutes.ts');
    expect(registrar).toMatch(/\/me\/member-discovery\/network'/);
    expect(registrar).toMatch(/\/me\/member-discovery\/network\/preview'/);
    expect(registrar).toMatch(/member-people-engagement/);
    expect(registrar).toMatch(/loadMemberPeopleNetworkRoster/);
    expect(registrar).toMatch(/loadMemberPeopleNetworkPreview/);
    expect(registrar).toMatch(/'buddies'/);
  });
});
