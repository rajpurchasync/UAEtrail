import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildDiscoverPeopleOnTrips, memberDiscoverProfilePath } from './whosGoingDiscover';

describe('memberDiscoverProfilePath', () => {
  it('tags discover opens for quota and analytics', () => {
    expect(memberDiscoverProfilePath('user-1')).toBe('/member/user-1?discover=1&source=discover');
  });
});

describe('buildDiscoverPeopleOnTrips', () => {
  it('collects non-buddy participant previews', () => {
    const item = {
      id: 'act-1',
      source: 'activity',
      title: 'Friday hike',
      activity: { title: 'Friday hike', hostUserId: 'host-1' },
      participantPreviews: [
        { id: 'u2', name: 'Sam', avatar: null },
        { id: 'u3', name: 'Lee', avatar: null },
      ],
    } as ExploreMapItemDTO;

    const rows = buildDiscoverPeopleOnTrips([item], new Set(['host-1']));
    expect(rows.map((r) => r.userId)).toEqual(['u2', 'u3']);
  });
});
