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

  it('does not treat leftover demand: exploreItemId as a pin', () => {
    expect(
      exploreMapItemPathFromSeekingRow({
        userId: 'u1',
        displayName: 'Alex',
        avatarUrl: null,
        participantIntentId: 'int-legacy',
        seekingTitle: 'Camp',
        exploreItemId: 'demand:int-legacy',
      })
    ).toBe('/explore?list=1');
  });

  it('omits pin when exploreItemId is not activity-scoped', () => {
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
