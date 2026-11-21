import {
  activityFilterToMapFilter,
  serializeExploreActivityDatePreset,
  venueFilterToMapFilter,
  type ActivityListFilterKey,
  type ExploreActivityDatePreset,
  type ExplorePanel,
  type MapFilterKey,
  type VenueListFilterKey,
} from './routing';
import {
  serializeExploreBuddySubtype,
  type ExploreBuddySubtypeKey,
} from './exploreBuddySubtype';
import {
  serializeExploreOutingTopic,
  type ExploreOutingTopicKey,
} from './exploreOutingTopic';
import {
  serializeExploreMapFilterPillsParam,
  serializeExploreSearchScope,
  type ExploreMapFilterPillKey,
  type ExploreSearchScopeKey,
} from './exploreBrowseTaxonomy';
import type { ProductSearchMutationContext } from '../routing/productSearchMutation';
import { applyProductSearchMutation } from '../routing/productSearchMutation';
import type { BrowseMainCategoryKey } from '../list/browseListTaxonomy';
import { BROWSE_DISCOVER_PARAM, LIST_CAT_PARAM } from '../list/browseListUrlState';
import {
  BUDDIES_SEGMENT_URL_PARAM,
  serializeBuddiesDiscoverySegment,
  type BuddiesDiscoverySegment,
} from '../list/buddiesDiscoverySegment';
import {
  serializeExplorePinKindFilter,
  type ExplorePinKindFilter,
} from './explorePinKindFilter';
import {
  serializePeopleBrowseTab,
  type PeopleBrowseTab,
} from '@/people-discovery/peopleBrowseTab';
import {
  EXPLORE_ACTIVITY_MODE_FILTER_PARAM,
  serializeExploreActivityModeFilter,
  type ExploreActivityModeFilter,
} from './exploreActivityModeFilter';
import {
  EXPLORE_PLACE_TYPES_PARAM,
  EXPLORE_TRIP_TYPES_PARAM,
  serializePlaceMapTopicsParam,
  serializeTripMapTopicsParam,
  type PlaceMapTopicKey,
  type TripMapTopicKey,
} from './exploreMapQuickTopicFilters';
import {
  EXPLORE_FACILITY_KINDS_PARAM,
  EXPLORE_HAS_TRIP_PARAM,
  EXPLORE_PRICE_PARAM,
  serializeExploreFacilityKinds,
  serializeExploreHasTrip,
  serializeExplorePriceFilter,
  type ExplorePriceFilter,
} from './exploreOptionalFilters';
import type { PlaceKind } from '@uaetrail/shared-types';
import { BROWSE_GEO_PARAM, serializeBrowseGeoPath } from '../list/browseGeoPath';
export type ExploreBrowseListMode = 'default' | 'people';

export type ExploreBrowseUrlSyncPatch = {
  filter?: MapFilterKey;
  activityFilter?: ActivityListFilterKey;
  placesFilter?: VenueListFilterKey;
  panel?: ExplorePanel;
  list?: boolean;
  browse?: boolean;
  q?: string;
  venueRegions?: string[];
  geoPath?: string[];
  activityDatePreset?: ExploreActivityDatePreset;
  activityModeFilter?: ExploreActivityModeFilter;
  buddySubtype?: ExploreBuddySubtypeKey;
  outingTopic?: ExploreOutingTopicKey;
  pinKind?: ExplorePinKindFilter;
  topicPills?: ExploreMapFilterPillKey[];
  listMode?: ExploreBrowseListMode;
  peopleBrowseOpen?: boolean;
  searchScope?: ExploreSearchScopeKey | null;
  peopleBrowseTab?: PeopleBrowseTab;
  buddiesDiscoverSegment?: BuddiesDiscoverySegment;
  listCat?: BrowseMainCategoryKey | null;
  tripMapTopics?: TripMapTopicKey[];
  placeMapTopics?: PlaceMapTopicKey[];
  priceFilter?: ExplorePriceFilter;
  hasTrip?: boolean;
  facilityKinds?: readonly PlaceKind[];
};

export type ExploreBrowseUrlSyncState = {
  mapFilter: MapFilterKey;
  activityFilter: ActivityListFilterKey;
  venueFilter: VenueListFilterKey;
  panel: ExplorePanel;
  listOpen: boolean;
  browseOpen: boolean;
  query: string;
  venueRegions: string[];
  geoPath: string[];
  activityDatePreset: ExploreActivityDatePreset;
  activityModeFilter: ExploreActivityModeFilter;
  buddySubtype: ExploreBuddySubtypeKey;
  outingTopic: ExploreOutingTopicKey;
  pinKind: ExplorePinKindFilter;
  topicPills: ExploreMapFilterPillKey[];
  listMode: ExploreBrowseListMode;
  peopleBrowseOpen: boolean;
  searchScope: ExploreSearchScopeKey | null;
  peopleBrowseTab: PeopleBrowseTab;
  tripMapTopics: TripMapTopicKey[];
  placeMapTopics: PlaceMapTopicKey[];
  priceFilter: ExplorePriceFilter;
  hasTrip: boolean;
  facilityKinds: readonly PlaceKind[];
};

/** Merge browse UI state + patch into explore URL search params (R2 / C18). */
export const buildExploreBrowseSearchParams = (input: {
  base: URLSearchParams;
  isDesktop: boolean;
  state: ExploreBrowseUrlSyncState;
  patch: ExploreBrowseUrlSyncPatch;
}): URLSearchParams => {
  const params = new URLSearchParams(input.base);
  const { state, patch } = input;
  const filterValue = patch.filter ?? state.mapFilter;
  const activityFilterValue = patch.activityFilter ?? state.activityFilter;
  const placesFilterValue = patch.placesFilter ?? state.venueFilter;
  const panelValue = patch.panel ?? state.panel;
  let listValue = patch.list ?? state.listOpen;
  let browseValue = patch.browse ?? state.browseOpen;
  if (!input.isDesktop) {
    if (patch.browse === true) listValue = false;
    if (patch.list === true) browseValue = false;
  }
  const queryValue = patch.q ?? state.query;
  const regionValue = patch.venueRegions ?? state.venueRegions;
  const geoPathValue = patch.geoPath ?? state.geoPath ?? [];
  const dateValue =
    patch.activityDatePreset !== undefined ? patch.activityDatePreset : state.activityDatePreset;
  const activityModeValue =
    patch.activityModeFilter !== undefined ? patch.activityModeFilter : state.activityModeFilter;
  const subtypeValue = patch.buddySubtype ?? state.buddySubtype;
  const topicValue = patch.outingTopic ?? state.outingTopic;
  const pinKindValue = patch.pinKind ?? state.pinKind;
  const topicPillsValue = patch.topicPills ?? state.topicPills;
  const tripMapTopicsValue = patch.tripMapTopics ?? state.tripMapTopics ?? [];
  const placeMapTopicsValue = patch.placeMapTopics ?? state.placeMapTopics ?? [];
  const priceFilterValue = patch.priceFilter ?? state.priceFilter ?? 'all';
  const hasTripValue = patch.hasTrip ?? state.hasTrip ?? false;
  const facilityKindsValue = patch.facilityKinds ?? state.facilityKinds ?? [];
  const listModeValue = patch.listMode ?? state.listMode;
  const peopleBrowseOpenValue = patch.peopleBrowseOpen ?? state.peopleBrowseOpen;
  const peoplePanelActive = peopleBrowseOpenValue || listModeValue === 'people';
  const searchScopeValue = patch.searchScope !== undefined ? patch.searchScope : state.searchScope;

  if (filterValue === 'all') {
    const fromActivity = activityFilterToMapFilter(activityFilterValue);
    const fromPlaces = venueFilterToMapFilter(placesFilterValue);
    const inferred = fromActivity ?? fromPlaces;
    if (inferred && inferred !== 'all') params.set('filter', inferred);
    else params.delete('filter');
  } else {
    params.set('filter', filterValue);
  }

  params.delete('activity');
  params.delete('places');

  if (panelValue === 'activities') params.delete('panel');
  else params.set('panel', panelValue);

  if (listValue) params.set('list', '1');
  else params.delete('list');

  if (browseValue) params.set(BROWSE_DISCOVER_PARAM, '1');
  else params.delete(BROWSE_DISCOVER_PARAM);

  if (queryValue.trim()) params.set('q', queryValue.trim());
  else params.delete('q');

  const serializedDate = serializeExploreActivityDatePreset(dateValue);
  if (serializedDate) params.set('date', serializedDate);
  else params.delete('date');

  const serializedActivityMode = serializeExploreActivityModeFilter(activityModeValue);
  if (serializedActivityMode) params.set(EXPLORE_ACTIVITY_MODE_FILTER_PARAM, serializedActivityMode);
  else params.delete(EXPLORE_ACTIVITY_MODE_FILTER_PARAM);

  const serializedSubtype = serializeExploreBuddySubtype(subtypeValue, filterValue);
  if (serializedSubtype) params.set('subtype', serializedSubtype);
  else params.delete('subtype');

  const serializedTopic = serializeExploreOutingTopic(topicValue, filterValue, subtypeValue);
  if (serializedTopic) params.set('outingTopic', serializedTopic);
  else params.delete('outingTopic');

  const serializedPinKind = serializeExplorePinKindFilter(pinKindValue);
  if (serializedPinKind) params.set('pinKind', serializedPinKind);
  else params.delete('pinKind');

  const serializedTopics = serializeExploreMapFilterPillsParam(topicPillsValue);
  if (serializedTopics) params.set('topics', serializedTopics);
  else params.delete('topics');

  const serializedTripTypes = serializeTripMapTopicsParam(tripMapTopicsValue);
  if (serializedTripTypes) params.set(EXPLORE_TRIP_TYPES_PARAM, serializedTripTypes);
  else params.delete(EXPLORE_TRIP_TYPES_PARAM);

  const serializedPlaceTypes = serializePlaceMapTopicsParam(placeMapTopicsValue);
  if (serializedPlaceTypes) params.set(EXPLORE_PLACE_TYPES_PARAM, serializedPlaceTypes);
  else params.delete(EXPLORE_PLACE_TYPES_PARAM);

  const serializedPrice = serializeExplorePriceFilter(priceFilterValue);
  if (serializedPrice) params.set(EXPLORE_PRICE_PARAM, serializedPrice);
  else params.delete(EXPLORE_PRICE_PARAM);

  const serializedHasTrip = serializeExploreHasTrip(hasTripValue);
  if (serializedHasTrip) params.set(EXPLORE_HAS_TRIP_PARAM, serializedHasTrip);
  else params.delete(EXPLORE_HAS_TRIP_PARAM);

  const serializedFacilityKinds = serializeExploreFacilityKinds(facilityKindsValue);
  if (serializedFacilityKinds) params.set(EXPLORE_FACILITY_KINDS_PARAM, serializedFacilityKinds);
  else params.delete(EXPLORE_FACILITY_KINDS_PARAM);

  const peopleBrowseTabValue = patch.peopleBrowseTab ?? state.peopleBrowseTab;
  if (peoplePanelActive) {
    params.set('view', 'people');
    params.delete('goingTab');
    params.delete('socialTab');
    const serializedPeopleTab = serializePeopleBrowseTab(peopleBrowseTabValue);
    if (serializedPeopleTab) params.set('peopleTab', serializedPeopleTab);
    else params.delete('peopleTab');
    const serializedBuddies = serializeBuddiesDiscoverySegment(peopleBrowseTabValue);
    if (serializedBuddies) params.set(BUDDIES_SEGMENT_URL_PARAM, serializedBuddies);
    else params.delete(BUDDIES_SEGMENT_URL_PARAM);
  } else {
    params.delete('view');
    params.delete('peopleTab');
    params.delete('socialTab');
    params.delete('goingTab');
  }

  params.delete('followedKind');

  const serializedSearchScope = serializeExploreSearchScope(searchScopeValue);
  if (serializedSearchScope) params.set('searchScope', serializedSearchScope);
  else params.delete('searchScope');
  params.delete('searchFocus');

  if (regionValue.length > 0) {
    params.set('regions', regionValue.join(','));
    params.delete('region');
  } else {
    params.delete('regions');
    params.delete('region');
  }

  const geoSerialized = serializeBrowseGeoPath(geoPathValue);
  if (geoSerialized) params.set(BROWSE_GEO_PARAM, geoSerialized);
  else params.delete(BROWSE_GEO_PARAM);

  params.delete('addLocation');
  /* Keep create/join overlays (`compose`, etc.) — browse sync must not dismiss FAB sessions. */
  params.delete('contribute');
  params.delete('request');
  params.delete('fulfillIntent');
  params.delete('hostDemand');

  if (patch.listCat === null) params.delete(LIST_CAT_PARAM);
  else if (patch.listCat) params.set(LIST_CAT_PARAM, patch.listCat);

  return params;
};

/** Commit explore browse filter query through the shared product URL writer. */
export const commitExploreBrowseUrlSync = (
  ctx: ProductSearchMutationContext,
  input: {
    isDesktop: boolean;
    state: ExploreBrowseUrlSyncState;
    patch: ExploreBrowseUrlSyncPatch;
  }
): void => {
  applyProductSearchMutation(ctx, (params) => {
    const built = buildExploreBrowseSearchParams({
      base: params,
      isDesktop: input.isDesktop,
      state: input.state,
      patch: input.patch,
    });
    for (const key of [...params.keys()]) {
      params.delete(key);
    }
    built.forEach((value, key) => params.set(key, value));
  });
};
