import { describe, expect, it } from 'vitest';
import { excludedSeekingActivityMapItem } from './exploreMapItemFixtures';
import {
  findExploreMapItemForPinId,
  resolveActivityIdForExplorePinId,
} from './exploreMapPinResolve';

describe('exploreMapPinResolve', () => {
  it('does not treat leftover demand: pins as map rows', () => {
    const items = [
      excludedSeekingActivityMapItem({
        id: 'activity:act-seek',
        activityId: 'act-seek',
      }),
    ];
    expect(findExploreMapItemForPinId(items, 'demand:int-legacy')).toBeNull();
    expect(resolveActivityIdForExplorePinId(items, 'demand:int-legacy')).toBeNull();
  });

  it('keeps direct activity pin resolution', () => {
    const items = [excludedSeekingActivityMapItem({ id: 'activity:act-2' })];
    expect(findExploreMapItemForPinId(items, 'activity:act-2')?.id).toBe('activity:act-2');
    expect(resolveActivityIdForExplorePinId(items, 'activity:act-2')).toBe('act-2');
  });
});
