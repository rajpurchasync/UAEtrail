import { setExploreClockStyle, type ExploreClockStyle } from '@uaetrail/shared-types';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { buildListFeedCards } from '../../list/buildListFeedCards';
import {
  filterExploreMapItemsForList,
  type BrowseListFilterState,
} from '../../list/browseListFilters';
import { sortListExplorerCards } from '../../list/explorer/listExplorerSort';
import { exploreHubWhereBrowseQuery } from './exploreHubWhereDisplay';
import {
  EXPLORE_HUB_HOME_UPCOMING_LIMIT,
  pickExploreHubUpcomingTripCards,
} from './exploreHubUpcomingTrips';

export type ExploreHubTripRelaxation = false | 'date' | 'where';

export type ExploreHubJoinableTripResult = {
  cards: DiscoveryCardModel[];
  relaxation: ExploreHubTripRelaxation;
};

const tripPoolFromFilters = (
  items: ExploreMapItemDTO[],
  filters: BrowseListFilterState,
  venueRegions: string[]
): ExploreMapItemDTO[] => filterExploreMapItemsForList(items, filters, venueRegions);

/** Same widen logic as the trip list — counts must match visible cards. */
export const resolveExploreHubTripPool = (
  items: ExploreMapItemDTO[],
  filters: BrowseListFilterState,
  venueRegions: string[]
): { pool: ExploreMapItemDTO[]; relaxation: ExploreHubTripRelaxation } => {
  const browseQuery = exploreHubWhereBrowseQuery(filters.query);
  const strict: BrowseListFilterState = { ...filters, query: browseQuery };

  let pool = tripPoolFromFilters(items, strict, venueRegions);
  let relaxation: ExploreHubTripRelaxation = false;

  if (pool.length === 0 && strict.activityDatePreset !== 'anyday') {
    pool = tripPoolFromFilters(
      items,
      { ...strict, activityDatePreset: 'anyday' },
      venueRegions
    );
    if (pool.length > 0) relaxation = 'date';
  }

  if (pool.length === 0 && browseQuery.trim()) {
    pool = tripPoolFromFilters(
      items,
      { ...strict, query: '', activityDatePreset: 'anyday' },
      venueRegions
    );
    if (pool.length > 0) relaxation = 'where';
  }

  return { pool, relaxation };
};

export const resolveExploreHubVenuePool = (
  items: ExploreMapItemDTO[],
  filters: BrowseListFilterState,
  venueRegions: string[]
): { pool: ExploreMapItemDTO[]; relaxed: boolean } => {
  const browseQuery = exploreHubWhereBrowseQuery(filters.query);
  const strict: BrowseListFilterState = { ...filters, query: browseQuery };
  let pool = tripPoolFromFilters(items, strict, venueRegions);
  let relaxed = false;

  if (pool.length === 0 && browseQuery.trim()) {
    pool = tripPoolFromFilters(items, { ...strict, query: '' }, venueRegions);
    relaxed = pool.length > 0;
  }

  return { pool, relaxed };
};

/** Strict hub filters first; widen to next dates or UAE-wide when nothing matches. */
export const resolveExploreHubJoinableTripCards = (
  items: ExploreMapItemDTO[],
  user: { id: string } | null | undefined,
  clock: ExploreClockStyle,
  filters: BrowseListFilterState,
  venueRegions: string[],
  regionHint: string,
  limit = EXPLORE_HUB_HOME_UPCOMING_LIMIT
): ExploreHubJoinableTripResult & { listingCount: number } => {
  const { pool, relaxation } = resolveExploreHubTripPool(items, filters, venueRegions);

  setExploreClockStyle(clock);
  const built = buildListFeedCards(pool, user, items);
  const sorted = sortListExplorerCards(built, 'event_asc', null);
  const hint = relaxation === 'where' ? '' : exploreHubWhereBrowseQuery(regionHint);
  const cards = pickExploreHubUpcomingTripCards(sorted, hint, limit);

  return { cards, relaxation, listingCount: pool.length };
};

export const exploreHubTripRelaxationCopy = (relaxation: ExploreHubTripRelaxation): string | null => {
  if (relaxation === 'date') return 'Nothing this week — showing the next closest outings.';
  if (relaxation === 'where') return 'No exact match for that place — showing upcoming outings across the UAE.';
  return null;
};

export const resolveExploreHubVenueCards = (
  items: ExploreMapItemDTO[],
  user: { id: string } | null | undefined,
  clock: ExploreClockStyle,
  filters: BrowseListFilterState,
  venueRegions: string[],
  limit = 10
): { cards: DiscoveryCardModel[]; relaxed: boolean; listingCount: number } => {
  const { pool, relaxed } = resolveExploreHubVenuePool(items, filters, venueRegions);

  setExploreClockStyle(clock);
  const cards = buildListFeedCards(pool, user, items).slice(0, limit);
  return { cards, relaxed, listingCount: pool.length };
};