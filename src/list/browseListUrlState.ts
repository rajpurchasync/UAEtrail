import {
  EXPLORE_FACILITY_KINDS_PARAM,
  EXPLORE_HAS_TRIP_PARAM,
  EXPLORE_PLACE_TYPES_PARAM,
  EXPLORE_PRICE_PARAM,
  EXPLORE_TRIP_TYPES_PARAM,
  aliasListPlaceTopicToMap,
  aliasPlaceMapTopicToList,
  parseExploreActivityDatePreset,
  parseExploreFacilityKinds,
  parseExploreHasTrip,
  parseExplorePriceFilter,
  parseMapFilter,
  parsePlaceMapTopicsParam,
  parseTripMapTopicsParam,
  parseVenueRegionsParam,
  serializeExploreActivityDatePreset,
  serializeExploreFacilityKinds,
  serializeExploreHasTrip,
  serializeExplorePriceFilter,
  serializePlaceMapTopicsParam,
  serializeTripMapTopicsParam,
  type ExploreActivityDatePreset,
  type MapFilterKey,
} from './discoveryListRuntime';
import type { BrowseListFilterState, BrowsePriceFilter, BrowseWhenFilter } from './browseListFilters';
import { isBrowseTripTopicKey, type BrowseTripTopicKey } from './browseListTripTopics';
import { isListVenuePlaceTopicKey } from './listVenuePlaceTopicFilter';
import type { ListVenuePlaceTopicKey } from './listVenuePlaceTopics';
import {
  parseBrowseMainCategoriesFromTopics,
  serializeBrowseMainCategoriesToTopics,
  type BrowseMainCategoryKey,
} from './browseListTaxonomy';
import { readPeopleCrewsTabParam } from '../routing/productUrlInbound';
import {
  PEOPLE_LIST_TAB_URL_PARAM,
  parsePeopleListBrowseTab,
  serializePeopleListBrowseTab,
} from './peopleListBrowseUrl';
import {
  BROWSE_AUDIENCE_PARAM,
  parseBrowseAudienceFilter,
  serializeBrowseAudienceFilter,
} from './browseAudienceFilter';
import {
  BROWSE_GEO_PARAM,
  parseBrowseGeoPath,
  serializeBrowseGeoPath,
} from './browseGeoPath';
import { listFilterMeansAvailabilityOnly } from '../routing/productUrlInbound';

const WHEN_PARAM = 'when';

/** List-only: dedicated category page (decoupled from map `topics` pills). */
export const LIST_CAT_PARAM = 'listCat';

/** Legacy inbound `browse=1` on `/explore` — rewritten to `/list`. */
export const BROWSE_DISCOVER_PARAM = 'browse';

export const parseBrowseDiscoverOpen = (value: string | null): boolean => value === '1';

export const parseListCatParam = (value: string | null): BrowseMainCategoryKey | null => {
  if (value === 'shops') return 'venues';
  if (value === 'activities' || value === 'trips') return 'activities';
  if (value === 'guides') return 'people';
  if (value === 'venues' || value === 'people' || value === 'agencies') {
    return value;
  }
  return null;
};

export const parseBrowseListPriceParam = (value: string | null): BrowsePriceFilter =>
  parseExplorePriceFilter(value);

export const serializeBrowseListPriceParam = (price: BrowsePriceFilter): string | null =>
  serializeExplorePriceFilter(price);

export const parseBrowseListWhenParam = (
  whenParam: string | null,
  dateParam: string | null
): BrowseWhenFilter => {
  if (whenParam === 'weekend') return 'weekend';
  if (whenParam === 'week') return 'week';
  const preset = parseExploreActivityDatePreset(dateParam);
  if (preset === 'week') return 'week';
  return 'any';
};

export const browseWhenToExploreDatePreset = (when: BrowseWhenFilter): ExploreActivityDatePreset => {
  if (when === 'week') return 'week';
  return 'anyday';
};

const parseTripAndPlaceTopics = (
  filterParam: string | null,
  listCat: BrowseMainCategoryKey | null
): {
  tripTopics: BrowseTripTopicKey[];
  tripAvailabilityOnly: boolean;
  placeTopics: ListVenuePlaceTopicKey[];
} => {
  if (!filterParam || filterParam === 'all') {
    return { tripTopics: [], tripAvailabilityOnly: false, placeTopics: [] };
  }
  if (listFilterMeansAvailabilityOnly(filterParam)) {
    return { tripTopics: [], tripAvailabilityOnly: true, placeTopics: [] };
  }

  const tripTopics: BrowseTripTopicKey[] = [];
  const placeTopics: ListVenuePlaceTopicKey[] = [];
  const venuesContext = listCat === 'venues';
  const tripsContext = listCat === 'activities';

  for (const part of filterParam.split(',')) {
    const trimmed = part.trim();
    const parsed = parseMapFilter(trimmed);
    if (venuesContext) {
      if (isListVenuePlaceTopicKey(trimmed) && !placeTopics.includes(trimmed)) {
        placeTopics.push(trimmed);
      }
      continue;
    }
    if (tripsContext) {
      if (isBrowseTripTopicKey(parsed) && !tripTopics.includes(parsed)) {
        tripTopics.push(parsed);
      }
      continue;
    }
    if (isBrowseTripTopicKey(parsed) && !tripTopics.includes(parsed)) {
      tripTopics.push(parsed);
    }
    if (isListVenuePlaceTopicKey(trimmed) && !placeTopics.includes(trimmed)) {
      placeTopics.push(trimmed);
    }
  }
  return { tripTopics, tripAvailabilityOnly: false, placeTopics };
};

const resolveBrowseActivityDatePreset = (
  whenParam: string | null,
  dateParam: string | null
): ExploreActivityDatePreset => {
  const fromDate = parseExploreActivityDatePreset(dateParam);
  if (fromDate !== 'anyday') return fromDate;
  if (whenParam === 'week' || parseBrowseListWhenParam(whenParam, dateParam) === 'week') {
    return 'week';
  }
  return 'anyday';
};

export const parseBrowseListFilterState = (
  searchParams: Pick<URLSearchParams, 'get'>
): BrowseListFilterState => {
  const whenParam = searchParams.get(WHEN_PARAM);
  const dateParam = searchParams.get('date');
  const when = parseBrowseListWhenParam(whenParam, dateParam);
  const activityDatePreset = resolveBrowseActivityDatePreset(whenParam, dateParam);
  const whenNormalized = when === 'week' && activityDatePreset === 'week' ? 'any' : when;
  const rawListCat = searchParams.get(LIST_CAT_PARAM);
  const listCat = parseListCatParam(rawListCat);
  const topicParse = parseTripAndPlaceTopics(searchParams.get('filter'), listCat);
  const tripTypes = parseTripMapTopicsParam(searchParams.get(EXPLORE_TRIP_TYPES_PARAM));
  const placeTypes = parsePlaceMapTopicsParam(searchParams.get(EXPLORE_PLACE_TYPES_PARAM)).map(
    aliasPlaceMapTopicToList
  );
  const tripTopics = tripTypes.length > 0 ? tripTypes : topicParse.tripTopics;
  let placeTopics =
    placeTypes.length > 0 ? placeTypes : topicParse.placeTopics;
  if (rawListCat === 'shops' && !placeTopics.includes('shop')) {
    placeTopics = [...placeTopics, 'shop'];
  }

  return {
    query: searchParams.get('q')?.trim() ?? '',
    categories: parseBrowseMainCategoriesFromTopics(searchParams.get('topics')),
    tripTopics,
    tripAvailabilityOnly: topicParse.tripAvailabilityOnly,
    placeTopics,
    price: parseBrowseListPriceParam(searchParams.get(EXPLORE_PRICE_PARAM)),
    when: whenNormalized,
    activityDatePreset,
    peopleBrowseTab: parsePeopleListBrowseTab(readPeopleCrewsTabParam(searchParams)),
    hasTrip: parseExploreHasTrip(searchParams.get(EXPLORE_HAS_TRIP_PARAM)),
    facilityKinds: parseExploreFacilityKinds(searchParams.get(EXPLORE_FACILITY_KINDS_PARAM)),
    audience: parseBrowseAudienceFilter(searchParams.get(BROWSE_AUDIENCE_PARAM)),
  };
};

export const parseBrowseListVenueRegions = (
  searchParams: Pick<URLSearchParams, 'get'>
): string[] => parseVenueRegionsParam(searchParams);

export const parseBrowseListGeoPath = (
  searchParams: Pick<URLSearchParams, 'get'>
): string[] => parseBrowseGeoPath(searchParams.get(BROWSE_GEO_PARAM));

export { BROWSE_GEO_PARAM };

export const serializeBrowseListSearchParams = (
  state: BrowseListFilterState,
  regions: string[],
  geoPath: readonly string[] = []
): URLSearchParams => {
  const params = new URLSearchParams();
  if (state.query.trim()) params.set('q', state.query.trim());

  const topics = serializeBrowseMainCategoriesToTopics(state.categories);
  if (topics) params.set('topics', topics);

  if (state.tripAvailabilityOnly) {
    params.set('filter', 'availability');
  } else if (state.tripTopics.length > 0) {
    params.set('filter', state.tripTopics.join(','));
  } else if (state.placeTopics.length > 0) {
    params.set('filter', state.placeTopics.join(','));
  }

  const tripTypes = serializeTripMapTopicsParam(state.tripTopics);
  if (tripTypes) params.set(EXPLORE_TRIP_TYPES_PARAM, tripTypes);

  const placeMapTopics = state.placeTopics
    .map(aliasListPlaceTopicToMap)
    .filter((key): key is NonNullable<typeof key> => key != null);
  const placeTypes = serializePlaceMapTopicsParam(placeMapTopics);
  if (placeTypes) params.set(EXPLORE_PLACE_TYPES_PARAM, placeTypes);

  const price = serializeBrowseListPriceParam(state.price);
  if (price) params.set(EXPLORE_PRICE_PARAM, price);

  const hasTrip = serializeExploreHasTrip(state.hasTrip);
  if (hasTrip) params.set(EXPLORE_HAS_TRIP_PARAM, hasTrip);

  const facilityKinds = serializeExploreFacilityKinds(state.facilityKinds);
  if (facilityKinds) params.set(EXPLORE_FACILITY_KINDS_PARAM, facilityKinds);

  const dateSerialized = serializeExploreActivityDatePreset(state.activityDatePreset);
  if (dateSerialized) params.set('date', dateSerialized);

  if (state.when === 'weekend') {
    params.set(WHEN_PARAM, 'weekend');
  }

  if (regions.length > 0) params.set('regions', regions.join(','));

  const geoSerialized = serializeBrowseGeoPath(geoPath);
  if (geoSerialized) params.set(BROWSE_GEO_PARAM, geoSerialized);

  const audience = serializeBrowseAudienceFilter(state.audience);
  if (audience) params.set(BROWSE_AUDIENCE_PARAM, audience);

  const peopleTab = serializePeopleListBrowseTab(state.peopleBrowseTab);
  if (peopleTab) params.set(PEOPLE_LIST_TAB_URL_PARAM, peopleTab);

  return params;
};

/** Re-export — implementation in `browseListMapHandoff.ts` (map pinKind + listCat stripping). */
export { serializeBrowseListToExploreSearchParams } from './browseListMapHandoff';

export type { BrowseMainCategoryKey };
