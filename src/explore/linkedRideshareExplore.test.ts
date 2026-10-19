import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../discovery';
import {
  finalizeDiscoveryCardLinkedRideshare,
  listLinkedRideshareExploreRows,
} from './linkedRideshareExplore';

const ride = (parentId: string, id: string): ExploreMapItemDTO =>
  ({
    id: `activity:${id}`,
    kind: 'rideshare',
    source: 'activity',
    title: `Ride ${id}`,
    latitude: 25.1,
    longitude: 55.2,
    path: `/activity/${id}`,
    activity: {
      id,
      linkedActivityId: parentId,
      activityType: 'rideshare',
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

describe('finalizeDiscoveryCardLinkedRideshare', () => {
  it('adds carpool badge and linked rows on parent outing peek card', () => {
    const parentId = 'parent-1';
    const parentItem = {
      id: `activity:${parentId}`,
      kind: 'hiking',
      source: 'activity',
      title: 'Hatta hike',
      latitude: 25.1,
      longitude: 55.2,
      path: `/activity/${parentId}`,
      activity: { id: parentId, activityType: 'hiking', requirements: [] },
    } as unknown as ExploreMapItemDTO;
    const items = [parentItem, ride(parentId, 'r1')];
    const card = finalizeDiscoveryCardLinkedRideshare(
      buildDiscoveryCardViewModelCard(parentItem),
      parentItem,
      items
    );
    expect(card.linkedRideshares).toHaveLength(1);
    expect(card.requirementBadges).toContain('Rideshare available');
  });

  it('back-links carpool peek card to parent outing', () => {
    const parentId = 'parent-1';
    const parentItem = {
      id: `activity:${parentId}`,
      kind: 'hiking',
      source: 'activity',
      title: 'Hatta hike',
      latitude: 25.1,
      longitude: 55.2,
      path: `/activity/${parentId}`,
      activity: { id: parentId, activityType: 'hiking' },
    } as ExploreMapItemDTO;
    const carpoolItem = ride(parentId, 'r1');
    const card = finalizeDiscoveryCardLinkedRideshare(
      buildDiscoveryCardViewModelCard(carpoolItem),
      carpoolItem,
      [parentItem, carpoolItem]
    );
    expect(card.activity?.linkedParentActivity?.id).toBe(parentId);
    expect(card.activity?.linkedParentActivity?.title).toBe('Hatta hike');
  });
});
