import { describe, expect, it } from 'vitest';
import type { FriendSummaryDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildFriendActivityPresenceRows } from '../src/services/friend-activity-presence.js';

const buddy = (userId: string): FriendSummaryDTO => ({
  userId,
  displayName: userId,
  avatarUrl: null,
  connectedAt: new Date().toISOString(),
});

describe('buildFriendActivityPresenceRows', () => {
  it('links buddies to hosting and participant activities on the map', () => {
    const hosting = {
      id: 'activity:host-trip',
      source: 'activity',
      title: 'Host trip',
      featuredPerson: { userId: 'buddy-a', displayName: 'A', avatarUrl: null, role: 'host' },
      activity: { id: 'host-trip', hostUserId: 'buddy-a' },
      viewerAccess: { exposure: 'peek', gateReason: null },
    } as ExploreMapItemDTO;

    const joining = {
      id: 'activity:join-trip',
      source: 'activity',
      title: 'Join trip',
      activity: { id: 'join-trip', hostUserId: 'other-host' },
      participantPreviews: [{ id: 'buddy-b', name: 'B', avatar: null }],
      viewerAccess: { exposure: 'peek', gateReason: null },
    } as ExploreMapItemDTO;

    const rows = buildFriendActivityPresenceRows(
      [buddy('buddy-a'), buddy('buddy-b')],
      [hosting, joining],
      'anyday'
    );

    expect(rows[0]?.hosting?.activityId).toBe('host-trip');
    expect(rows[1]?.joining?.activityId).toBe('join-trip');
  });
});
