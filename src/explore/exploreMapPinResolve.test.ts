import { describe, expect, it } from 'vitest';
import { seekingExploreMapItem } from './exploreMapItemFixtures';
import {
  findExploreMapItemForPinId,
  resolveActivityIdForExplorePinId,
} from './exploreMapPinResolve';

describe('exploreMapPinResolve', () => {
  it('does not treat leftover demand: pins as map rows', () => {
    const items = [
      seekingExploreMapItem({
        id: 'activity:act-seek',
        participantIntentId: 'int-legacy',
      }),
    ];
    expect(findExploreMapItemForPinId(items, 'demand:int-legacy')).toBeNull();
    expect(resolveActivityIdForExplorePinId(items, 'demand:int-legacy')).toBeNull();
  });

  it('keeps direct activity pin resolution', () => {
    const items = [seekingExploreMapItem({ id: 'activity:act-2' })];
    expect(findExploreMapItemForPinId(items, 'activity:act-2')?.id).toBe('activity:act-2');
    expect(resolveActivityIdForExplorePinId(items, 'activity:act-2')).toBe('act-2');
  });
});
