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
    ).toBe('/explore?list=1&panel=activities&pin=activity%3Aact-9');
  });

  it('preserves inbound demand: bookmarks and does not mint them', () => {
    expect(
      exploreMapItemPathFromSeekingRow({
        userId: 'u1',
        displayName: 'Alex',
        avatarUrl: null,
        participantIntentId: 'int-legacy',
        seekingTitle: 'Camp',
        exploreItemId: 'demand:int-legacy',
      })
    ).toBe('/explore?list=1&pin=demand%3Aint-legacy');
  });

  it('omits pin when exploreItemId is neither activity nor inbound demand', () => {
    expect(
      exploreMapItemPathFromSeekingRow({
        userId: 'u1',
        displayName: 'Alex',
        avatarUrl: null,
        participantIntentId: 'int-bare',
        seekingTitle: 'Hike',
        exploreItemId: 'int-bare',
      })
    ).toBe('/explore?list=1');
  });

  it('parses activity id from explore item id', () => {
    expect(activityIdFromExploreMapItemId('activity:act-1')).toBe('act-1');
    expect(activityIdFromExploreMapItemId('demand:x')).toBeNull();
  });
});
