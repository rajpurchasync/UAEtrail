import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildMemberDiscoveryOnTripRowsFromMapItems } from '../src/services/member-discovery-on-trip-rows.js';

describe('buildMemberDiscoveryOnTripRowsFromMapItems', () => {
  it('returns public strangers on filtered activities', () => {
    const item = {
      id: 'activity:act-1',
      source: 'activity',
      title: 'Friday hike',
      date: '2026-10-10',
      activity: { title: 'Friday hike', id: 'act-1', hostUserId: 'host-1' },
      participantPreviews: [
        { id: 'u2', name: 'Sam', avatar: null },
        { id: 'u3', name: 'Lee', avatar: null },
      ],
      viewerAccess: { exposure: 'peek', gateReason: null },
    } as ExploreMapItemDTO;

    const rows = buildMemberDiscoveryOnTripRowsFromMapItems([item], {
      viewerUserId: 'viewer',
      excludeUserIds: new Set(['host-1']),
      datePreset: 'anyday',
      discoverableUserIds: new Set(['u2', 'u3']),
    });

    expect(rows.map((r) => r.userId)).toEqual(['u2', 'u3']);
  });
});
