import { exploreMapItemIsAvailabilityCatalog } from '@uaetrail/shared-types';
import type { ExploreMapItemDTO, MemberDiscoveryAvailabilityRowDTO } from '@uaetrail/shared-types';
import { buildAvailabilityFixedMapItems } from '../lib/availability-fixed-map-items.js';
import { listPublishedDestinations } from '../lib/destinations-store.js';
import {
  matchesExploreActivityDateFilter,
  type ExploreActivityDatePreset,
} from '../lib/explore-activity-date-filter.js';
import { enrichExploreMapPayloadViewerAccess } from '../lib/explore-map-viewer-access.js';

const matchesMemberDiscoverySearch = (
  parts: Array<string | null | undefined>,
  search?: string
): boolean => {
  const needle = search?.trim().toLowerCase();
  if (!needle) return true;
  const haystack = parts.filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(needle);
};

export const projectAvailabilityCatalogRows = (
  items: ExploreMapItemDTO[],
  input: {
    excludeUserIds: Set<string>;
    datePreset: ExploreActivityDatePreset;
    search?: string;
  }
): MemberDiscoveryAvailabilityRowDTO[] => {
  const seen = new Set<string>();
  const rows: MemberDiscoveryAvailabilityRowDTO[] = [];

  for (const item of items) {
    if (!exploreMapItemIsAvailabilityCatalog(item)) continue;
    if (!matchesExploreActivityDateFilter(item, input.datePreset)) continue;
    if (item.viewerAccess?.exposure === 'none') continue;

    const userId = item.featuredPerson?.userId ?? null;
    if (!userId || input.excludeUserIds.has(userId) || seen.has(userId)) continue;

    const displayName = item.featuredPerson?.displayName ?? item.subtitle ?? 'Member';
    const availabilityTitle = item.title?.trim() || 'Available to go together';
    if (
      !matchesMemberDiscoverySearch([displayName, availabilityTitle, item.subtitle ?? null], input.search)
    ) {
      continue;
    }

    seen.add(userId);
    rows.push({
      userId,
      displayName,
      avatarUrl: item.featuredPerson?.avatarUrl ?? null,
      availabilityTitle,
      exploreItemId: item.id,
    });
  }

  return rows;
};

/** Fixed-slot availability rows for crew discover (no full map catalog). */
export const loadDiscoverCrewAvailabilityRows = async (input: {
  viewerUserId: string;
  userRole?: string | null;
  excludeUserIds: Set<string>;
  datePreset: ExploreActivityDatePreset;
  search?: string;
}): Promise<MemberDiscoveryAvailabilityRowDTO[]> => {
  const publishedDestinations = await listPublishedDestinations();
  const destinationSlugById = new Map(publishedDestinations.map((area) => [area.id, area.slug]));
  const destinationNameById = new Map(publishedDestinations.map((area) => [area.id, area.name]));
  const fixedItems = await buildAvailabilityFixedMapItems({ destinationSlugById, destinationNameById });
  const enriched = await enrichExploreMapPayloadViewerAccess(
    { items: fixedItems },
    { viewerUserId: input.viewerUserId, userRole: input.userRole }
  );
  return projectAvailabilityCatalogRows(enriched.items, {
    excludeUserIds: input.excludeUserIds,
    datePreset: input.datePreset,
    search: input.search,
  });
};