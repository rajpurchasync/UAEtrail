import { describe, expect, it } from 'vitest';
import { seekingExploreMapItem } from './exploreMapItemFixtures';
import {
  findExploreMapItemForPinId,
  parseDemandMapItemIntentId,
  resolveActivityIdForExplorePinId,
} from './exploreMapPinResolve';

describe('exploreMapPinResolve (R4)', () => {
  it('parses legacy demand pin intent ids', () => {
    expect(parseDemandMapItemIntentId('demand:int-1')).toBe('int-1');
    expect(parseDemandMapItemIntentId('activity:act-1')).toBeNull();
  });

  it('resolves demand deep link to activity seeking row by participantIntentId', () => {
    const items = [
      seekingExploreMapItem({
        id: 'activity:act-seek',
        participantIntentId: 'int-legacy',
      }),
    ];
    expect(findExploreMapItemForPinId(items, 'demand:int-legacy')?.id).toBe('activity:act-seek');
    expect(resolveActivityIdForExplorePinId(items, 'demand:int-legacy')).toBe('act-seek');
  });

  it('keeps direct activity pin resolution', () => {
    const items = [seekingExploreMapItem({ id: 'activity:act-2' })];
    expect(findExploreMapItemForPinId(items, 'activity:act-2')?.id).toBe('activity:act-2');
    expect(resolveActivityIdForExplorePinId(items, 'activity:act-2')).toBe('act-2');
  });
});
