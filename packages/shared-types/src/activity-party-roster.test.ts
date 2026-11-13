import { describe, expect, it } from 'vitest';
import {
  derivePartyHeadcountFromRoster,
  partyRosterHasPendingFamilyInvite,
  type ActivityPartyMemberDTO,
} from './activity-party-roster.js';

const member = (
  partial: Partial<ActivityPartyMemberDTO> & Pick<ActivityPartyMemberDTO, 'membershipId' | 'memberType' | 'status'>
): ActivityPartyMemberDTO => ({
  groupId: 'g1',
  userId: partial.memberType === 'adult' ? 'u1' : null,
  displayName: 'Member',
  ...partial,
});

describe('activity party roster', () => {
  it('counts primary joiner plus family adults and kids', () => {
    expect(
      derivePartyHeadcountFromRoster([
        member({ membershipId: 'a1', memberType: 'adult', status: 'family_invited' }),
        member({ membershipId: 'k1', memberType: 'kid', status: 'confirmed' }),
      ])
    ).toEqual({ adults: 2, kids: 1 });
  });

  it('ignores declined members', () => {
    expect(
      derivePartyHeadcountFromRoster([
        member({ membershipId: 'a1', memberType: 'adult', status: 'declined' }),
      ])
    ).toEqual({ adults: 1, kids: 0 });
  });

  it('detects pending family invites', () => {
    expect(
      partyRosterHasPendingFamilyInvite([
        member({ membershipId: 'a1', memberType: 'adult', status: 'family_invited' }),
      ])
    ).toBe(true);
    expect(
      partyRosterHasPendingFamilyInvite([
        member({ membershipId: 'a1', memberType: 'adult', status: 'confirmed' }),
      ])
    ).toBe(false);
  });
});
