import { describe, expect, it } from 'vitest';
import { buildRecommendedCrewFeed } from './buildRecommendedCrewFeed';

describe('buildRecommendedCrewFeed', () => {
  it('orders friends then availability then directory and de-dupes by user id', () => {
    const rows = buildRecommendedCrewFeed({
      friendsGoing: [
        {
          userId: 'f1',
          displayName: 'Friend One',
          avatarUrl: null,
          cityLabel: 'Dubai',
          upcomingTrip: { exploreItemId: 'activity:a1', title: 'Hike' },
        },
      ],
      hostsGoing: [],
      availabilityPeople: [
        {
          userId: 'f1',
          displayName: 'Friend One',
          avatarUrl: null,
          isBuddy: true,
          kinds: ['hiking'],
          slots: [{ date: '2026-03-01', kinds: ['hiking'] }],
        },
        {
          userId: 'a2',
          displayName: 'Available Two',
          avatarUrl: null,
          isBuddy: false,
          kinds: ['hiking'],
          slots: [{ date: '2026-03-02', kinds: ['hiking'] }],
        },
      ],
      directory: [
        {
          id: 'd1',
          displayName: 'Dir One',
          avatarUrl: null,
          city: 'Abu Dhabi',
          profileRoleLabel: null,
          outingsCount: 2,
        },
        {
          id: 'a2',
          displayName: 'Available Two',
          avatarUrl: null,
          city: 'Dubai',
          profileRoleLabel: null,
          outingsCount: 1,
        },
      ],
      discoveryQuota: { limit: 3, used: 0, periodDays: 30 },
      caps: { friends: 5, available: 5, directory: 2 },
    });

    expect(rows.map((r) => r.userId)).toEqual(['f1', 'a2', 'd1']);
  });
});