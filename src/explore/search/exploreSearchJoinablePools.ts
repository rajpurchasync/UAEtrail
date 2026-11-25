import { setExploreClockStyle, type ExploreClockStyle } from '@uaetrail/shared-types';
import type { DestinationPublicDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import {
  buildListFeedCards,
  filterExploreMapItemsForList,
  resolveEffectiveBrowseVenueRegions,
  sortBrowseListCards,
  type BrowseListFilterState,
} from '../../discovery/discoverySession';
import { exploreSearchWhereBrowseQuery } from './exploreSearchWhereQuery';
import {
  EXPLORE_SEARCH_HOME_UPCOMING_LIMIT,
  pickExploreSearchUpcomingTripCards,
} from './exploreSearchUpcomingTrips';

export type ExploreSearchTripRelaxation = false | 'date' | 'where';

export type ExploreSearchJoinableTripResult = {
  cards: DiscoveryCardModel[];
  relaxation: ExploreSearchTripRelaxation;
};

const tripPoolFromFilters = (
  items: ExploreMapItemDTO[],
  filters: BrowseListFilterState,
  venueRegions: string[],
  geoPath: readonly string[] = [],
  publishedDestinations: readonly DestinationPublicDTO[] = []
): ExploreMapItemDTO[] =>
  filterExploreMapItemsForList(items, filters, venueRegions, geoPath, publishedDestinations);

/** Same widen logic as trip list — counts must match visible cards. */
export const resolveExploreSearchTripPool = (
  items: ExploreMapItemDTO[],
  filters: BrowseListFilterState,
  venueRegions: string[],
  geoPath: readonly string[] = [],
  publishedDestinations: readonly DestinationPublicDTO[] = []
): { pool: ExploreMapItemDTO[]; relaxation: ExploreSearchTripRelaxation } => {
  const browseQuery = exploreSearchWhereBrowseQuery(filters.query);
  const strict: BrowseListFilterState = { ...filters, query: browseQuery };

  let pool = tripPoolFromFilters(items, strict, venueRegions, geoPath, publishedDestinations);
  let relaxation: ExploreSearchTripRelaxation = false;

  if (pool.length === 0 && strict.activityDatePreset !== 'anyday') {
    pool = tripPoolFromFilters(
      items,
      { ...strict, activityDatePreset: 'anyday' },
      venueRegions,
      geoPath,
      publishedDestinations
    );
    if (pool.length > 0) relaxation = 'date';
  }

  if (pool.length === 0 && browseQuery.trim()) {
    pool = tripPoolFromFilters(
      items,
      { ...strict, query: '', activityDatePreset: 'anyday' },
      venueRegions,
      geoPath,
      publishedDestinations
    );
    if (pool.length > 0) relaxation = 'where';
  }

  return { pool, relaxation };
};

export const resolveExploreSearchVenuePool = (
  items: ExploreMapItemDTO[],
  filters: BrowseListFilterState,
  venueRegions: string[],
  geoPath: readonly string[] = [],
  publishedDestinations: readonly DestinationPublicDTO[] = []
): { pool: ExploreMapItemDTO[]; relaxed: boolean } => {
  const browseQuery = exploreSearchWhereBrowseQuery(filters.query);
  const strict: BrowseListFilterState = { ...filters, query: browseQuery };
  let pool = tripPoolFromFilters(items, strict, venueRegions, geoPath, publishedDestinations);
  let relaxed = false;

  if (pool.length === 0 && browseQuery.trim()) {
    pool = tripPoolFromFilters(items, { ...strict, query: '' }, venueRegions, geoPath, publishedDestinations);
    relaxed = pool.length > 0;
  }

  return { pool, relaxed };
};

export const exploreSearchTripRelaxationCopy = (relaxation: ExploreSearchTripRelaxation): string | null => {
  if (relaxation === 'date') return 'Nothing this week — showing the next closest outings.';
  if (relaxation === 'where') return 'No exact match for that place — showing upcoming outings across the UAE.';
  return null;
};

/** Strict filters first; widen to next dates or UAE-wide when nothing matches. */
export const resolveExploreSearchJoinableTripCards = (
  items: ExploreMapItemDTO[],
  user: { id: string } | null | undefined,
  clock: ExploreClockStyle,
  filters: BrowseListFilterState,
  venueRegions: string[],
  regionHint: string,
  limit = EXPLORE_SEARCH_HOME_UPCOMING_LIMIT,
  geoPath: readonly string[] = [],
  publishedDestinations: readonly DestinationPublicDTO[] = [],
  pickStyle: 'recommend' | 'query' = 'query'
): ExploreSearchJoinableTripResult & { listingCount: number } => {
  const effectiveRegions = resolveEffectiveBrowseVenueRegions(venueRegions, geoPath, publishedDestinations);
  const { pool, relaxation } = resolveExploreSearchTripPool(
    items,
    filters,
    effectiveRegions,
    geoPath,
    publishedDestinations
  );

  setExploreClockStyle(clock);
  const built = buildListFeedCards(pool, user, items);
  const sorted = sortBrowseListCards(built, 'event_asc', null);
  const hint = relaxation === 'where' ? '' : exploreSearchWhereBrowseQuery(regionHint);
  const cards =
    pickStyle === 'recommend'
      ? pickExploreSearchUpcomingTripCards(sorted, hint, limit)
      : sorted.slice(0, limit);

  return { cards, relaxation, listingCount: pool.length };
};

export const resolveExploreSearchVenueCards = (
  items: ExploreMapItemDTO[],
  user: { id: string } | null | undefined,
  clock: ExploreClockStyle,
  filters: BrowseListFilterState,
  venueRegions: string[],
  limit = 10,
  geoPath: readonly string[] = [],
  publishedDestinations: readonly DestinationPublicDTO[] = []
): { cards: DiscoveryCardModel[]; relaxed: boolean; listingCount: number } => {
  const effectiveRegions = resolveEffectiveBrowseVenueRegions(venueRegions, geoPath, publishedDestinations);
  const { pool, relaxed } = resolveExploreSearchVenuePool(
    items,
    filters,
    effectiveRegions,
    geoPath,
    publishedDestinations
  );

  setExploreClockStyle(clock);
  const cards = buildListFeedCards(pool, user, items).slice(0, limit);
  return { cards, relaxed, listingCount: pool.length };
};