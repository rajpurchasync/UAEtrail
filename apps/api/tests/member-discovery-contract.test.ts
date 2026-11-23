import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('member-discovery API contract', () => {
  it('registrar exposes object-centric member discovery paths only', () => {
    const source = read('src/routes/user/registerMemberDiscoveryRoutes.ts');
    expect(source).not.toMatch(/\/me\/member-discovery\/roster/);
    expect(source).toMatch(/\/me\/member-discovery\/quota/);
    expect(source).toMatch(/\/me\/member-discovery\/browse/);
    expect(source).toMatch(/\/me\/member-discovery\/network/);
    expect(source).toMatch(/\/me\/member-discovery\/search/);
    expect(source).not.toMatch(/\/users\/browse/);
    expect(source).not.toMatch(/\/social\/people/);
    expect(source).not.toMatch(/registerSocialPeopleRoutes/);
    expect(source).not.toMatch(/whos-going/i);
    expect(source).not.toMatch(/\/:id\/invites/);
  });

  it('activity join invites register under participation registrar', () => {
    const memberCompose = read('src/routes/user/composeUserMemberRoutes.ts');
    const inviteRegistrar = read('src/routes/user/registerActivityJoinInviteRoutes.ts');
    expect(memberCompose).toMatch(/registerActivityJoinInviteRoutes/);
    expect(inviteRegistrar).toMatch(/registerActivityRoute/);
    expect(inviteRegistrar).toMatch(/\/:id\/invites/);
  });

  it('buddy activity presence registers under buddy routes', () => {
    const buddyRoutes = read('src/routes/user/registerBuddyRoutes.ts');
    expect(buddyRoutes).toMatch(/\/me\/buddies\/activity-presence/);
    expect(buddyRoutes).not.toMatch(/whos-going/i);
  });

  it('discovery roster uses availabilityOnMap wire field (not lookingFor)', () => {
    const roster = read('src/services/member-discovery-roster.ts');
    expect(roster).toContain('availabilityOnMap');
    expect(roster).not.toMatch(/\blookingFor\b/);
    expect(roster).toMatch(/loadDiscoverCrewAvailabilityRows/);
    expect(read('src/services/discover-crew-feed.ts')).toMatch(/availabilityFixed/);
  });

  it('discover crew feed route is registered (PLS-2)', () => {
    expect(read('src/routes/user/registerDiscoverCrewRoutes.ts')).toMatch(/\/discover\/crew/);
  });

  it('find crew feed is not duplicated under /me/member-discovery (GW-2b)', () => {
    const routes = read('src/routes/user/registerMemberDiscoveryRoutes.ts');
    expect(routes).not.toMatch(/loadDiscoverCrewFeed/);
    expect(routes).not.toMatch(/Deprecation/);
  });
});
