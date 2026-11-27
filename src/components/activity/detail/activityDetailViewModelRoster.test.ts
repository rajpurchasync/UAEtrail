import { describe, expect, it } from 'vitest';
import { filterActivityDetailRosterParticipants } from './activityDetailViewModelRoster';

describe('filterActivityDetailRosterParticipants', () => {
  const participants = [
    { id: 'u1', displayName: 'Alex' },
    { id: 'u2', displayName: 'Sam' },
  ];

  it('returns empty when pre-join roster is disabled', () => {
    expect(filterActivityDetailRosterParticipants(participants, false, null, false)).toEqual([]);
  });

  it('returns full roster for crew surfaces', () => {
    expect(filterActivityDetailRosterParticipants(participants, true, null, true)).toEqual(participants);
  });

  it('filters to friend ids when roster is gated', () => {
    const filtered = filterActivityDetailRosterParticipants(
      participants,
      false,
      {
        canViewFullFriendRoster: false,
        friendUserIdsOnActivity: ['u2'],
      } as import('@uaetrail/shared-types').ActivityViewerEntitlementsDTO,
      true
    );
    expect(filtered.map((p) => p.id)).toEqual(['u2']);
  });
});