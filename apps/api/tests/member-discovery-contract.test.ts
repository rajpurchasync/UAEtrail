import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('member-discovery API contract', () => {
  it('registrar exposes object-centric member discovery paths only', () => {
    const source = read('src/routes/user/registerMemberDiscoveryRoutes.ts');
    expect(source).toMatch(/\/me\/member-discovery\/roster/);
    expect(source).toMatch(/\/me\/member-discovery-quota/);
    expect(source).toMatch(/\/users\/browse/);
    expect(source).not.toMatch(/whos-going/i);
    expect(source).not.toMatch(/\/:id\/invites/);
  });

  it('activity join invites register under participation registrar', () => {
    const userRouter = read('src/routes/user.ts');
    const inviteRegistrar = read('src/routes/user/registerActivityJoinInviteRoutes.ts');
    expect(userRouter).toMatch(/registerActivityJoinInviteRoutes/);
    expect(inviteRegistrar).toMatch(/registerActivityRoute/);
    expect(inviteRegistrar).toMatch(/\/:id\/invites/);
  });

  it('buddy activity presence registers under buddy routes', () => {
    const buddyRoutes = read('src/routes/user/registerBuddyRoutes.ts');
    expect(buddyRoutes).toMatch(/\/me\/buddies\/activity-presence/);
    expect(buddyRoutes).not.toMatch(/whos-going/i);
  });

  it('discovery roster uses domain seekingOnMap wire field (not lookingFor)', () => {
    const roster = read('src/services/member-discovery-roster.ts');
    expect(roster).toContain('seekingOnMap');
    expect(roster).not.toMatch(/\blookingFor\b/);
    expect(roster).toContain('seekingTitle');
    expect(roster).not.toMatch(/\bdemandTitle\b/);
  });
});
