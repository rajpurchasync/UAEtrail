import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { matchesUnifiedExploreMapItem } from './exploreMapPinModel';

const item = (partial: Partial<ExploreMapItemDTO> & Pick<ExploreMapItemDTO, 'id' | 'source' | 'kind'>): ExploreMapItemDTO =>
  ({
    title: 'Test',
    latitude: 25,
    longitude: 55,
    ...partial,
  }) as ExploreMapItemDTO;

describe('matchesUnifiedExploreMapItem', () => {
  it('shows hiking trail and hosted hike under hiking + all pins', () => {
    const trail = item({ id: 'venue:1', source: 'venue', kind: 'hiking' });
    const trip = item({ id: 'activity:1', source: 'activity', kind: 'hiking', date: '2099-01-01' });
    const input = {
      mapFilter: 'hiking' as const,
      pinKind: 'all' as const,
      activityDatePreset: 'anyday' as const,
      venueRegions: [],
    };
    expect(matchesUnifiedExploreMapItem(trail, input)).toBe(true);
    expect(matchesUnifiedExploreMapItem(trip, input)).toBe(true);
  });

  it('pin kind places hides hosted trips', () => {
    const trail = item({ id: 'venue:1', source: 'venue', kind: 'hiking' });
    const trip = item({ id: 'activity:1', source: 'activity', kind: 'hiking', date: '2099-01-01' });
    const input = {
      mapFilter: 'all' as const,
      pinKind: 'places' as const,
      activityDatePreset: 'anyday' as const,
      venueRegions: [],
    };
    expect(matchesUnifiedExploreMapItem(trail, input)).toBe(true);
    expect(matchesUnifiedExploreMapItem(trip, input)).toBe(false);
  });

  it('pin kind places includes facility venues', () => {
    const toilet = item({
      id: 'venue:99',
      source: 'venue',
      kind: 'event',
      placeKind: 'toilet',
    });
    const input = {
      mapFilter: 'all' as const,
      pinKind: 'places' as const,
      activityDatePreset: 'anyday' as const,
      venueRegions: [],
    };
    expect(matchesUnifiedExploreMapItem(toilet, input)).toBe(true);
  });

  it('pin kind shops includes contributed peek shops', () => {
    const contributed = item({
      id: 'venue:shop-1',
      source: 'venue',
      kind: 'shop',
      catalogProfileExposure: 'peek',
    });
    const input = {
      mapFilter: 'all' as const,
      pinKind: 'shops' as const,
      activityDatePreset: 'anyday' as const,
      venueRegions: [],
    };
    expect(matchesUnifiedExploreMapItem(contributed, input)).toBe(true);
  });
});
