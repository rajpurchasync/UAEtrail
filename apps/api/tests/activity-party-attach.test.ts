import { describe, expect, it } from 'vitest';
import { resolveJoinPartyFromBody } from '../src/services/activity-party-attach.js';

describe('resolveJoinPartyFromBody', () => {
  it('returns headcount snapshot when no roster membership ids', async () => {
    const solo = await resolveJoinPartyFromBody({
      actorUserId: 'user-1',
    });
    expect(solo).toEqual({
      adults: 1,
      kids: 0,
      partyMembers: undefined,
      partyApprovalPending: false,
      sourceTeamId: null,
      deferHostApproval: false,
    });

    const group = await resolveJoinPartyFromBody({
      actorUserId: 'user-1',
      adults: 3,
      kids: 2,
    });
    expect(group.adults).toBe(3);
    expect(group.kids).toBe(2);
    expect(group.partyMembers).toBeUndefined();
    expect(group.sourceTeamId).toBeNull();
  });
});