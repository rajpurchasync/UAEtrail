import {
  activityFilterToMapFilter,
  parseActivityListFilter,
  resolveExploreMapActivityDatePreset,
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
import { parseExploreOthersSubtype, type ExploreOthersSubtypeKey } from './exploreOthersSubtype';
import { parseExploreOutingTopic, type ExploreOutingTopicKey } from './exploreOutingTopic';
import { MAP_FILTERS_BY_BROWSE_TAB, parseDesktopBrowseTab, type DesktopBrowseTab } from './ui/exploreBrowsePanelCopy';
import { parseListOpen } from './ui/exploreListPanelUrl';
import {
  parseExploreMapFilterPillsParam,
  parseExploreSearchScope,
  type ExploreMapFilterPillKey,
  type ExploreSearchScopeKey,
} from './exploreBrowseTaxonomy';
import {
  BROWSE_DISCOVER_PARAM,
  BROWSE_GEO_PARAM,
  LIST_CAT_PARAM,
  parseBrowseGeoPath,
  parseListCatParam,
} from '../discovery/discoverySession';
import type { ExploreBrowseListMode } from './exploreBrowseUrlSync';
import { readExploreSearchScopeParam } from '../routing/productUrlInbound';
import { parseExplorePinKindFilter, type ExplorePinKindFilter } from './explorePinKindFilter';
import {
  parseCrewBrowseState,
  type CrewBrowseLane,
  type CrewPeopleFacet,
  type CrewProfessionalKind,
} from '@/crew-discovery/crewBrowseTab';
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
import { mergeExploreHydrateWithListBrowseSession } from '../discovery/discoveryBrowseListSessionExploreParity';

export type ParseExploreBrowseStateOptions = {
  pathname?: string;
};

const isCrewsBrowseListView = (view: string | null): boolean =>
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
  geoPath: string[];
  activityDatePreset: ExploreActivityDatePreset;
  activityModeFilter: ExploreActivityModeFilter;
  othersSubtype: ExploreOthersSubtypeKey;
  outingTopic: ExploreOutingTopicKey;
  pinKind: ExplorePinKindFilter;
  topicPills: ExploreMapFilterPillKey[];
  listMode: ExploreBrowseListMode;
  crewsBrowseOpen: boolean;
  searchScope: ExploreSearchScopeKey | null;
  crewBrowseLane: CrewBrowseLane;
  crewPeopleFacet: CrewPeopleFacet;
  crewProfessionalKind: CrewProfessionalKind;
  desktopBrowseTab: DesktopBrowseTab;
  expandSearch: boolean;
  tripMapTopics: TripMapTopicKey[];
  placeMapTopics: PlaceMapTopicKey[];
  priceFilter: ExplorePriceFilter;
  hasTrip: boolean;
  facilityKinds: PlaceKind[];
};

/** Guests do not open the people browse rail from a shared URL. */
export const clampGuestCrewsBrowse = (
  state: ExploreBrowseUrlHydratedState,
  isSignedIn: boolean
): ExploreBrowseUrlHydratedState =>
  isSignedIn
    ? state
    : {
        ...state,
        crewsBrowseOpen: false,
        listMode: state.listMode === 'crews' ? 'default' : state.listMode,
      };

/** Parse explore browse UI state from URL (R2 / C18). */
export const parseExploreBrowseStateFromSearchParams = (
  searchParams: URLSearchParams,
  isDesktop: boolean,
  options?: ParseExploreBrowseStateOptions
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
  const nextSubtype = parseExploreOthersSubtype(searchParams.get('subtype'), nextMapFilter);

  const hydrated: ExploreBrowseUrlHydratedState = {
    mapFilter: nextMapFilter,
    activityFilter,
    panel: nextPanel,
    listOpen: isDesktop
      ? searchParams.get('list') === '1' || isCrewsBrowseListView(searchParams.get('view'))
      : parseListOpen(
          searchParams.get('list'),
          false,
          searchParams.get(BROWSE_DISCOVER_PARAM),
          isCrewsBrowseListView(searchParams.get('view'))
        ),
    browseOpen: false,
    query: searchParams.get('q') ?? '',
    venueFilter,
    venueRegions: parseVenueRegionsParam(searchParams),
    geoPath: parseBrowseGeoPath(searchParams.get(BROWSE_GEO_PARAM)),
    activityDatePreset: resolveExploreMapActivityDatePreset(searchParams.get('date')),
    activityModeFilter: parseExploreActivityModeFilter(
      searchParams.get(EXPLORE_ACTIVITY_MODE_FILTER_PARAM)
    ),
    othersSubtype: nextSubtype,
    outingTopic: parseExploreOutingTopic(searchParams.get('outingTopic'), nextMapFilter, nextSubtype),
    pinKind: parseExplorePinKindFilter(searchParams.get('pinKind')),
    topicPills: parseExploreMapFilterPillsParam(searchParams.get('topics')),
    listMode:
      !isDesktop && isCrewsBrowseListView(searchParams.get('view')) ? 'crews' : 'default',
    crewsBrowseOpen: false,
    searchScope: parseExploreSearchScope(readExploreSearchScopeParam(searchParams)),
    ...(() => {
      const crew = parseCrewBrowseState(searchParams);
      return {
        crewBrowseLane: crew.lane,
        crewPeopleFacet: crew.facet,
        crewProfessionalKind: crew.proKind,
      };
    })(),
    desktopBrowseTab: parseDesktopBrowseTab(nextPanel),
    expandSearch: Boolean(isDesktop && searchParams.get('q')?.trim()),
    tripMapTopics: parseTripMapTopicsParam(searchParams.get(EXPLORE_TRIP_TYPES_PARAM)),
    placeMapTopics: parsePlaceMapTopicsParam(searchParams.get(EXPLORE_PLACE_TYPES_PARAM)),
    priceFilter: parseExplorePriceFilter(searchParams.get(EXPLORE_PRICE_PARAM)),
    hasTrip: parseExploreHasTrip(searchParams.get(EXPLORE_HAS_TRIP_PARAM)),
    facilityKinds: parseExploreFacilityKinds(searchParams.get(EXPLORE_FACILITY_KINDS_PARAM)),
  };

  if (!options?.pathname) return hydrated;
  return mergeExploreHydrateWithListBrowseSession(hydrated, options.pathname, searchParams, isDesktop);
};
