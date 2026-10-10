import { describe, expect, it } from 'vitest';
import {
  activityIdFromExploreMapItemId,
  exploreMapItemPathFromSeekingRow,
} from './memberDiscoverySeekingRow';

describe('memberDiscoverySeekingRow routing', () => {
  it('prefers activity pin in explore path when exploreItemId is activity-scoped', () => {
    expect(
      exploreMapItemPathFromSeekingRow({
        userId: 'u1',
        displayName: 'Alex',
        avatarUrl: null,
        participantIntentId: 'int-1',
        seekingTitle: 'Hike',
        exploreItemId: 'activity:act-9',
      })
    ).toBe('/explore?pin=activity%3Aact-9&list=1&panel=activities');
  });

  it('falls back to demand pin when only intent id is on the wire', () => {
    expect(
      exploreMapItemPathFromSeekingRow({
        userId: 'u1',
        displayName: 'Alex',
        avatarUrl: null,
        participantIntentId: 'int-legacy',
        seekingTitle: 'Camp',
        exploreItemId: 'demand:int-legacy',
      })
    ).toBe('/explore?pin=demand%3Aint-legacy&list=1&panel=activities');
  });

  it('parses activity id from explore item id', () => {
    expect(activityIdFromExploreMapItemId('activity:act-1')).toBe('act-1');
    expect(activityIdFromExploreMapItemId('demand:x')).toBeNull();
  });
});
