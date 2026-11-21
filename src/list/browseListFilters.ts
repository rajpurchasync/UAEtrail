import type { AreaPublicDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import { filterListAvailabilityCatalogItems } from '@/activity-discovery/catalog/listAvailabilityCatalog';
import {
  filterListCatalogByVenueRegions,
  mergeListCatalogPlansAndPlaces,
} from '@/places-discovery/catalog/listCatalog';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import {
  EXPLORE_PRICE_FILTER_OPTIONS,
  deriveVenueRegionSortOrder,
  exploreItemMatchesFacilityKinds,
  exploreItemMatchesPriceFilter,
  exploreItemMatchesQuery,
  explorePlaceHasHostedTrip,
  hostedPlaceLocationIdsFromCatalog,
  isPlacesMapItem,
  isShopListItem,
  matchesActivityDateFilter,
  matchesUnifiedTopicFilter,
  resolveExploreItemScheduleDate,
  type ExploreActivityDatePreset,
  type ExplorePriceFilter,
} from './discoveryListRuntime';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import { mapItemMatchesBrowseMainCategories } from './browseListTaxonomy';
import type { PlaceKind } from '@uaetrail/shared-types';
import type { BrowseTripTopicKey } from './browseListTripTopics';
import { matchesListVenuePlaceTopic } from './listVenuePlaceTopicFilter';
import type { ListVenuePlaceTopicKey } from './listVenuePlaceTopics';
import {
  exploreItemMatchesBrowseAudienceFilter,
  type BrowseAudienceFilter,
} from './browseAudienceFilter';
import type { PeopleBrowseTab } from '@/people-discovery/peopleBrowseTab';
import { exploreItemMatchesBrowseGeoPath } from './browseGeoPath';
/** @deprecated Use BrowseMainCategoryKey — kept for imports migrating */
export type BrowseCategoryKey = BrowseMainCategoryKey;

export type BrowsePriceFilter = ExplorePriceFilter;

export type BrowseWhenFilter = 'any' | 'week' | 'weekend';

export type BrowseListFilterState = {
  query: string;
  /** Main buckets: Trips (activity + demand) · Venues · Shops */
  categories: BrowseMainCategoryKey[];
  /** Hosted trip topics — empty = all; OR match when multiple selected. */
  tripTopics: BrowseTripTopicKey[];
  /** Availability-only browse — `filter=availability` on `/list` (inbound `filter=looking` still parses). */
  tripAvailabilityOnly: boolean;
  /** Places category — hiking · camping · hubs, plus facilities/shop URL keys. */
  placeTopics: ListVenuePlaceTopicKey[];
  price: BrowsePriceFilter;
  when: BrowseWhenFilter;
  /** Aligns with explore map `?date=` (today · tomorrow · week · month). */
  activityDatePreset: ExploreActivityDatePreset;
  /** Crews list tab — mirrors explore `peopleTab` (Overview = hub). */
  peopleBrowseTab: PeopleBrowseTab;
  /** Venues with an upcoming hosted outing. Default off = all kinds. */
  hasTrip: boolean;
  /** Amenity subtypes — empty = all facilities when Facilities is selected. */
  facilityKinds: PlaceKind[];
  /** Who can attend — list filter modal. */
  audience: BrowseAudienceFilter;
};

export type { BrowseAudienceFilter };

export const BROWSE_PRICE_OPTIONS: ReadonlyArray<{ key: BrowsePriceFilter; label: string }> =
  EXPLORE_PRICE_FILTER_OPTIONS;

export const BROWSE_WHEN_OPTIONS: ReadonlyArray<{ key: BrowseWhenFilter; label: string }> = [
  { key: 'any', label: 'Any time' },
  { key: 'weekend', label: 'Weekend outings' },
];

const cardMatchesPrice = (card: DiscoveryCardModel, price: BrowsePriceFilter): boolean => {
  if (price === 'all') return true;
  const kind = card.price?.kind;
  if (kind === 'free' || kind === 'shared' || kind === 'paid') return kind === price;
  if (price === 'free') return !card.price;
  return false;
};

export const cardMatchesBrowsePrice = cardMatchesPrice;

const matchesWeekendBrowseFilter = (item: ExploreMapItemDTO): boolean => {
  if (isGeographyMapSource(item.source) || item.source === 'shop' || item.source === 'agency') return true;
  const schedule = resolveExploreItemScheduleDate(item);
  if (!schedule) return false;
  const day = new Date(`${schedule}T12:00:00`).getDay();
  return day === 5 || day === 6 || day === 0;
};

/** Client filter — explore topic pills + unified trip topic + list price/when. */
export const filterExploreMapItemsForList = (
  items: ExploreMapItemDTO[],
  state: BrowseListFilterState,
  venueRegions: string[],
  geoIds: readonly string[] = [],
  publishedAreas: readonly AreaPublicDTO[] = []
): ExploreMapItemDTO[] => {
  let pool = items;

  if (state.categories.length > 0) {
    pool = pool.filter((item) => mapItemMatchesBrowseMainCategories(item, state.categories));
  }

  const tripsCategoryInScope =
    state.categories.length === 0 || state.categories.includes('activities');
  const placesCategoryInScope =
    state.categories.length === 0 || state.categories.includes('venues');

  if (tripsCategoryInScope && state.tripAvailabilityOnly) {
    pool = filterListAvailabilityCatalogItems(pool);
  } else if (tripsCategoryInScope && state.tripTopics.length > 0) {
    pool = pool.filter((item) =>
      state.tripTopics.some((topic) => matchesUnifiedTopicFilter(item, topic, 'all', 'all'))
    );
  }

  if (placesCategoryInScope && state.placeTopics.length > 0) {
    const destinationTopics = state.placeTopics.filter((topic) => topic !== 'facilities');
    if (destinationTopics.length > 0) {
      pool = pool.filter((item) => {
        if (!isGeographyMapSource(item.source) && item.source !== 'shop') return false;
        return destinationTopics.some((topic) => matchesListVenuePlaceTopic(item, topic));
      });
    }
  }

  if (state.query.trim()) {
    pool = pool.filter((item) => exploreItemMatchesQuery(item, state.query));
  }

  if (tripsCategoryInScope && state.activityDatePreset !== 'anyday') {
    pool = pool.filter((item) => matchesActivityDateFilter(item, state.activityDatePreset));
  }
  if (tripsCategoryInScope && state.when === 'weekend') {
    pool = pool.filter(matchesWeekendBrowseFilter);
  }

  if (tripsCategoryInScope && state.price !== 'all') {
    pool = pool.filter((item) => exploreItemMatchesPriceFilter(item, state.price));
  }

  if (placesCategoryInScope && state.facilityKinds.length > 0) {
    pool = pool.filter((item) => exploreItemMatchesFacilityKinds(item, state.facilityKinds));
  }

  if (placesCategoryInScope && state.hasTrip) {
    const hostedIds = hostedPlaceLocationIdsFromCatalog(items);
    pool = pool.filter((item) => {
      if (!isPlacesMapItem(item) && !isShopListItem(item)) return true;
      return explorePlaceHasHostedTrip(item, hostedIds);
    });
  }

  const audience = state.audience ?? 'anyone';
  if (audience !== 'anyone') {
    pool = pool.filter((item) => exploreItemMatchesBrowseAudienceFilter(item, audience));
  }

  if (geoIds.length > 0) {
    pool = pool.filter((item) => exploreItemMatchesBrowseGeoPath(item, geoIds, publishedAreas));
  }

  pool = filterListCatalogByVenueRegions(pool, venueRegions);

  const venueRegionOrder = deriveVenueRegionSortOrder(publishedAreas);
  return mergeListCatalogPlansAndPlaces(pool, venueRegionOrder);
};
