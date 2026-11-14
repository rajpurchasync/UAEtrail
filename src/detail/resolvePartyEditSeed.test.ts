import { describe, expect, it } from 'vitest';
import type { MyActivityRequestDTO } from '@uaetrail/shared-types';
import { resolvePartyEditSeed } from './resolvePartyEditSeed';

const base = (patch: Partial<MyActivityRequestDTO>): MyActivityRequestDTO => ({
  id: 'req-1',
  status: 'pending',
  canWithdraw: true,
  ...patch,
});

describe('resolvePartyEditSeed', () => {
  it('uses team mode when partyMembers are present', () => {
    const seed = resolvePartyEditSeed(
      base({
        sourceTeamId: 'team-1',
        partyMembers: [
          {
            membershipId: 'm-1',
            groupId: 'team-1',
            memberType: 'kid',
            userId: null,
            displayName: 'Kid',
            status: 'confirmed',
          },
        ],
      })
    );
    expect(seed.mode).toBe('team');
    expect(seed.membershipIds).toEqual(['m-1']);
    expect(seed.teamId).toBe('team-1');
  });

  it('uses headcount when adults or kids exceed solo', () => {
    const seed = resolvePartyEditSeed(base({ adults: 2, kids: 1 }));
    expect(seed.mode).toBe('headcount');
    expect(seed.adults).toBe(2);
    expect(seed.kids).toBe(1);
  });

  it('defaults to me-only', () => {
    const seed = resolvePartyEditSeed(base({ adults: 1, kids: 0 }));
    expect(seed.mode).toBe('me');
  });
});