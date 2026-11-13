import {
  activityFilterToMapFilter,
  parseActivityListFilter,
  parseExploreActivityDatePreset,
  parseExplorePanel,
  parseMapFilter,
  parseVenueListFilter,
  parseVenueRegionsParam,
  venueFilterToMapFilter,
  type ActivityListFilterKey,
  type ExploreActivityDatePreset,
  type ExplorePanel,
  type MapFilterKey,
  type VenueListFilterKey,
} from './routing';
import { parseExploreBuddySubtype, type ExploreBuddySubtypeKey } from './exploreBuddySubtype';
import { parseExploreOutingTopic, type ExploreOutingTopicKey } from './exploreOutingTopic';
import { MAP_FILTERS_BY_BROWSE_TAB, parseDesktopBrowseTab, type DesktopBrowseTab } from './ui/exploreBrowsePanelCopy';
import { parseListOpen } from './ui/exploreListPanelUrl';
import {
  parseExploreMapFilterPillsParam,
  parseExploreSearchScope,
  type ExploreMapFilterPillKey,
  type ExploreSearchScopeKey,
} from './exploreBrowseTaxonomy';
import { BROWSE_DISCOVER_PARAM, LIST_CAT_PARAM, parseListCatParam } from '../list/browseListUrlState';
import type { ExploreBrowseListMode } from './exploreBrowseUrlSync';
import {
  BUDDIES_SEGMENT_URL_PARAM,
  parseBuddiesDiscoverySegment,
  type BuddiesDiscoverySegment,
} from '../list/buddiesDiscoverySegment';
import { parseExplorePinKindFilter, type ExplorePinKindFilter } from './explorePinKindFilter';
import { parsePeopleBrowseTabFromUrl, type PeopleBrowseTab } from '@/people-discovery/peopleBrowseTab';
import {
  EXPLORE_ACTIVITY_MODE_FILTER_PARAM,
  parseExploreActivityModeFilter,
  type ExploreActivityModeFilter,
} from './exploreActivityModeFilter';
import {
  EXPLORE_PLACE_TYPES_PARAM,
  EXPLORE_TRIP_TYPES_PARAM,
  parsePlaceMapTopicsParam,
  parseTripMapTopicsParam,
  type PlaceMapTopicKey,
  type TripMapTopicKey,
} from './exploreMapQuickTopicFilters';
import {
  EXPLORE_FACILITY_KINDS_PARAM,
  EXPLORE_HAS_TRIP_PARAM,
  EXPLORE_PRICE_PARAM,
  parseExploreFacilityKinds,
  parseExploreHasTrip,
  parseExplorePriceFilter,
  type ExplorePriceFilter,
} from './exploreOptionalFilters';
import type { PlaceKind } from '@uaetrail/shared-types';

const readPeopleBrowseTabParam = (params: URLSearchParams): string | null =>
  params.get('peopleTab') ?? params.get('socialTab');

const isPeopleBrowseListView = (view: string | null): boolean =>
  view === 'people' || view === 'social' || view === 'going';

export type ExploreBrowseUrlHydratedState = {
  mapFilter: MapFilterKey;
  activityFilter: ActivityListFilterKey;
  panel: ExplorePanel;
  listOpen: boolean;
  browseOpen: boolean;
  query: string;
  venueFilter: VenueListFilterKey;
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
  buddiesDiscoverSegment: BuddiesDiscoverySegment;
  desktopBrowseTab: DesktopBrowseTab;
  expandSearch: boolean;
  tripMapTopics: TripMapTopicKey[];
  placeMapTopics: PlaceMapTopicKey[];
  priceFilter: ExplorePriceFilter;
  hasTrip: boolean;
  facilityKinds: PlaceKind[];
};

/** Guests do not open the people browse rail from a shared URL. */
export const clampGuestPeopleBrowse = (
  state: ExploreBrowseUrlHydratedState,
  isSignedIn: boolean
): ExploreBrowseUrlHydratedState =>
  isSignedIn
    ? state
    : {
        ...state,
        peopleBrowseOpen: false,
        listMode: state.listMode === 'people' ? 'default' : state.listMode,
      };

/** Parse explore browse UI state from URL (R2 / C18). */
export const parseExploreBrowseStateFromSearchParams = (
  searchParams: URLSearchParams,
  isDesktop: boolean
): ExploreBrowseUrlHydratedState => {
  const nextMapFilterRaw = parseMapFilter(searchParams.get('filter'));
  let nextPanel = parseExplorePanel(searchParams.get('panel'));
  const listCat = parseListCatParam(searchParams.get(LIST_CAT_PARAM));
  if (isDesktop) {
    if (listCat === 'venues') {
      nextPanel = 'venues';
    } else if (listCat === null && searchParams.get('list') === '1') {
      nextPanel = 'activities';
    }
  }
  const nextBrowseTab = parseDesktopBrowseTab(nextPanel);
  const allowedForPlaces = MAP_FILTERS_BY_BROWSE_TAB.venues;
  const allowedForActivities = MAP_FILTERS_BY_BROWSE_TAB.activities;
  const inPlacesContext = isDesktop ? nextBrowseTab === 'venues' : nextPanel === 'venues';
  const inActivitiesContext = !inPlacesContext;
  const activityFilter = parseActivityListFilter(searchParams.get('activity'), searchParams.get('filter'));
  const venueFilter = parseVenueListFilter(
    searchParams.get('places'),
    searchParams.get('filter'),
    searchParams.get('activity')
  );
  let nextMapFilter = nextMapFilterRaw;
  if (nextMapFilter === 'all') {
    const lifted = inPlacesContext
      ? venueFilterToMapFilter(venueFilter)
      : activityFilterToMapFilter(activityFilter);
    if (lifted) nextMapFilter = lifted;
  }
  if (inPlacesContext && !allowedForPlaces.includes(nextMapFilter)) {
    nextMapFilter = 'all';
  } else if (inActivitiesContext && !allowedForActivities.includes(nextMapFilter)) {
    nextMapFilter = 'all';
  }
  const nextSubtype = parseExploreBuddySubtype(searchParams.get('subtype'), nextMapFilter);

  return {
    mapFilter: nextMapFilter,
    activityFilter,
    panel: nextPanel,
    listOpen: parseListOpen(
      searchParams.get('list'),
      isDesktop,
      searchParams.get(BROWSE_DISCOVER_PARAM),
      isPeopleBrowseListView(searchParams.get('view'))
    ),
    browseOpen: false,
    query: searchParams.get('q') ?? '',
    venueFilter,
    venueRegions: parseVenueRegionsParam(searchParams),
    activityDatePreset: parseExploreActivityDatePreset(searchParams.get('date')),
    activityModeFilter: parseExploreActivityModeFilter(
      searchParams.get(EXPLORE_ACTIVITY_MODE_FILTER_PARAM)
    ),
    buddySubtype: nextSubtype,
    outingTopic: parseExploreOutingTopic(searchParams.get('outingTopic'), nextMapFilter, nextSubtype),
    pinKind: parseExplorePinKindFilter(searchParams.get('pinKind')),
    topicPills: parseExploreMapFilterPillsParam(searchParams.get('topics')),
    listMode:
      !isDesktop && isPeopleBrowseListView(searchParams.get('view')) ? 'people' : 'default',
    peopleBrowseOpen: isDesktop && isPeopleBrowseListView(searchParams.get('view')),
    searchScope: parseExploreSearchScope(
      searchParams.get('searchScope') ?? searchParams.get('searchFocus')
    ),
    peopleBrowseTab: parsePeopleBrowseTabFromUrl(
      readPeopleBrowseTabParam(searchParams),
      searchParams.get('goingTab')
    ),
    buddiesDiscoverSegment: parseBuddiesDiscoverySegment(searchParams.get(BUDDIES_SEGMENT_URL_PARAM)),
    desktopBrowseTab: parseDesktopBrowseTab(nextPanel),
    expandSearch: Boolean(isDesktop && searchParams.get('q')?.trim()),
    tripMapTopics: parseTripMapTopicsParam(searchParams.get(EXPLORE_TRIP_TYPES_PARAM)),
    placeMapTopics: parsePlaceMapTopicsParam(searchParams.get(EXPLORE_PLACE_TYPES_PARAM)),
    priceFilter: parseExplorePriceFilter(searchParams.get(EXPLORE_PRICE_PARAM)),
    hasTrip: parseExploreHasTrip(searchParams.get(EXPLORE_HAS_TRIP_PARAM)),
    facilityKinds: parseExploreFacilityKinds(searchParams.get(EXPLORE_FACILITY_KINDS_PARAM)),
  };
};
