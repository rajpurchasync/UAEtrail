import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { listLinkedRideshareExploreRows } from './linkedRideshareExplore';

const ride = (parentId: string, id: string): ExploreMapItemDTO =>
  ({
    id: `activity:${id}`,
    kind: 'carpool',
    source: 'activity',
    title: `Ride ${id}`,
    latitude: 25.1,
    longitude: 55.2,
    path: `/activity/${id}`,
    activity: {
      id,
      linkedActivityId: parentId,
      activityType: 'carpool',
    },
  }) as ExploreMapItemDTO;

describe('listLinkedRideshareExploreRows', () => {
  it('returns all carpool map items linked to the parent activity', () => {
    const parentId = 'parent-1';
    const items = [ride(parentId, 'r1'), ride(parentId, 'r2'), ride('other', 'r3')];
    const rows = listLinkedRideshareExploreRows(parentId, items);
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.activityId).sort()).toEqual(['r1', 'r2']);
  });
});
