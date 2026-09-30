import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { venueItemMatchesRegions } from '../utils/venueRegionFilter';
import { matchesActivityDateFilter, type ExploreActivityDatePreset } from './exploreActivityDateFilter';
import {
  emptyExploreSearchScopeCounts,
  mapItemMatchesSearchScope,
  type ExploreSearchScopeCounts,
} from './exploreBrowseTaxonomy';
import { exploreItemMatchesQuery } from './exploreItemSearch';

export type { ExploreSearchScopeCounts };
export { exploreItemMatchesQuery, exploreItemSearchHaystack, normalizeExploreSearchText } from './exploreItemSearch';

export const countExploreSearchScopes = (
  items: ExploreMapItemDTO[],
  query: string,
  activityDatePreset: ExploreActivityDatePreset,
  venueRegions: string[]
): ExploreSearchScopeCounts => {
  const q = query.trim();
  if (!q) return emptyExploreSearchScopeCounts();

  const counts = emptyExploreSearchScopeCounts();

  for (const item of items) {
    if (!exploreItemMatchesQuery(item, q)) continue;
    if (mapItemMatchesSearchScope(item, 'trips') && matchesActivityDateFilter(item, activityDatePreset)) {
      counts.trips += 1;
      continue;
    }
    if (mapItemMatchesSearchScope(item, 'spots') && venueItemMatchesRegions(item, venueRegions)) {
      counts.spots += 1;
      continue;
    }
    if (mapItemMatchesSearchScope(item, 'shops')) {
      counts.shops += 1;
    }
  }

  return counts;
};
