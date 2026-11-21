import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { exploreItemMatchesBrowseAudienceFilter, parseBrowseAudienceFilter } from './browseAudienceFilter';

describe('browseAudienceFilter', () => {
  it('parses audience query param', () => {
    expect(parseBrowseAudienceFilter(null)).toBe('anyone');
    expect(parseBrowseAudienceFilter('with_pets')).toBe('with_pets');
  });

  it('matches women-only on hosted trips', () => {
    const item = {
      id: 'activity:a1',
      source: 'activity',
      activity: { requirements: ['Women only'] },
    } as ExploreMapItemDTO;
    expect(exploreItemMatchesBrowseAudienceFilter(item, 'women_only')).toBe(true);
    expect(exploreItemMatchesBrowseAudienceFilter(item, 'anyone')).toBe(true);
  });

  it('matches child-friendly places', () => {
    const item = {
      id: 'venue:v1',
      source: 'venue',
      locationCard: { childFriendly: true },
    } as ExploreMapItemDTO;
    expect(exploreItemMatchesBrowseAudienceFilter(item, 'with_child')).toBe(true);
  });
});