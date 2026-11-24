import type { CommunityDiscoverCardDTO } from '@uaetrail/shared-types';
import { exploreSearchWhereBrowseQuery } from './exploreSearchWhereQuery';

export const filterCommunityDiscoverCards = (
  rows: CommunityDiscoverCardDTO[],
  options: { query?: string; venueRegions?: string[] }
): CommunityDiscoverCardDTO[] => {
  const q = exploreSearchWhereBrowseQuery(options.query ?? '').trim().toLowerCase();
  const regions = (options.venueRegions ?? []).map((r) => r.trim().toLowerCase()).filter(Boolean);

  let filtered = rows;
  if (regions.length > 0) {
    filtered = filtered.filter((row) => {
      const area = row.geoRef.names.area?.trim().toLowerCase() ?? '';
      const state = row.geoRef.names.state?.trim().toLowerCase() ?? '';
      const slugArea = row.geoRef.slug?.area?.trim().toLowerCase() ?? '';
      return regions.some((r) => r === area || r === state || r === slugArea);
    });
  }

  if (!q) return filtered;

  return filtered.filter((row) => {
    const haystack = [
      row.name,
      row.summary,
      row.geoRef.names.area,
      row.geoRef.names.state,
      row.geoRef.names.country,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
};