import { describe, expect, it } from 'vitest';
import type { CommunityDiscoverCardDTO } from '@uaetrail/shared-types';
import { filterCommunityDiscoverCards } from './filterCommunityDiscoverCards';

const row = (name: string, area: string): CommunityDiscoverCardDTO => ({
  id: name,
  name,
  slug: name.toLowerCase(),
  summary: null,
  bannerUrl: null,
  visibility: 'public',
  joinPolicy: 'open',
  memberCount: 3,
  geoRef: {
    slug: { country: 'ae', area, locality: '' },
    names: { country: 'United Arab Emirates', state: area, area, locality: '' },
  },
});

describe('filterCommunityDiscoverCards', () => {
  const data = [row("Women's hiking", 'Dubai'), row('Trail runners', 'Abu Dhabi')];

  it('filters by query and region', () => {
    expect(filterCommunityDiscoverCards(data, { query: 'hiking' }).map((r) => r.name)).toEqual([
      "Women's hiking",
    ]);
    expect(filterCommunityDiscoverCards(data, { venueRegions: ['dubai'] }).map((r) => r.name)).toEqual([
      "Women's hiking",
    ]);
  });
});