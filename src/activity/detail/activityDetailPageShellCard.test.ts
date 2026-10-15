import { describe, expect, it } from 'vitest';
import { buildActivityDetailPageShellCard } from './activityDetailPageShellCard';

describe('buildActivityDetailPageShellCard', () => {
  it('builds an activity-sourced card for peek strips', () => {
    const card = buildActivityDetailPageShellCard({
      activity: {
        id: 'act-1',
        activityType: 'hiking',
        title: 'Sunrise hike',
        locationName: 'Hatta',
        status: 'published',
        slotsAvailable: 3,
        slotsTotal: 10,
        participants: [{ id: 'u1', name: 'Alex' }],
      } as Parameters<typeof buildActivityDetailPageShellCard>[0]['activity'],
      viewerAccess: { level: 'public', exposure: 'redacted', canAccessCrewSurfaces: false },
      wireStrips: {
        showParticipantsStrip: true,
        showLogisticsStrip: true,
        showJoinedStatusChipOnPeek: false,
        showHostSelfProfileLink: false,
        showOfferRideInLogistics: false,
        maskRosterToFriendsOnly: true,
        pendingJoinInviteCount: 0,
      },
    });
    expect(card.source).toBe('activity');
    expect(card.activityId).toBe('act-1');
    expect(card.path).toBe('/activity/act-1');
  });
});
