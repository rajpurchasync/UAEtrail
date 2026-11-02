import {
  serializeExploreActivityDatePreset,
  serializeVenueListFilter,
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
  const dateValue =
    patch.activityDatePreset !== undefined ? patch.activityDatePreset : state.activityDatePreset;
  const activityModeValue =
    patch.activityModeFilter !== undefined ? patch.activityModeFilter : state.activityModeFilter;
  const subtypeValue = patch.buddySubtype ?? state.buddySubtype;
  const topicValue = patch.outingTopic ?? state.outingTopic;
  const pinKindValue = patch.pinKind ?? state.pinKind;
  const topicPillsValue = patch.topicPills ?? state.topicPills;
  const listModeValue = patch.listMode ?? state.listMode;
  const peopleBrowseOpenValue = patch.peopleBrowseOpen ?? state.peopleBrowseOpen;
  const peoplePanelActive = peopleBrowseOpenValue || listModeValue === 'people';
  const searchScopeValue = patch.searchScope !== undefined ? patch.searchScope : state.searchScope;

  if (filterValue === 'all') params.delete('filter');
  else params.set('filter', filterValue);

  if (activityFilterValue === 'all') params.delete('activity');
  else params.set('activity', activityFilterValue);

  const serializedPlaces = serializeVenueListFilter(placesFilterValue);
  if (serializedPlaces) params.set('places', serializedPlaces);
  else params.delete('places');

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

  params.delete('addLocation');
  params.delete('compose');
  params.delete('contribute');
  params.delete('request');
  params.delete('fulfillIntent');
  params.delete('hostDemand');

  if (patch.listCat === null) params.delete(LIST_CAT_PARAM);
  else if (patch.listCat) params.set(LIST_CAT_PARAM, patch.listCat);

  return params;
};
