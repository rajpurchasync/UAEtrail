import {
  parseActivityListFilter,
  parseExploreActivityDatePreset,
  parseExplorePanel,
  parseMapFilter,
  parseVenueListFilter,
  parseVenueRegionsParam,
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
import { BROWSE_DISCOVER_PARAM, parseBrowseDiscoverOpen } from '../list/browseListUrlState';
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
};

/** Parse explore browse UI state from URL (R2 / C18). */
export const parseExploreBrowseStateFromSearchParams = (
  searchParams: URLSearchParams,
  isDesktop: boolean
): ExploreBrowseUrlHydratedState => {
  const nextMapFilterRaw = parseMapFilter(searchParams.get('filter'));
  const nextPanel = parseExplorePanel(searchParams.get('panel'));
  const nextBrowseTab = parseDesktopBrowseTab(nextPanel);
  const allowedForPlaces = MAP_FILTERS_BY_BROWSE_TAB.venues;
  const allowedForActivities = MAP_FILTERS_BY_BROWSE_TAB.activities;
  const inPlacesContext = isDesktop ? nextBrowseTab === 'venues' : nextPanel === 'venues';
  const inActivitiesContext = !inPlacesContext;
  let nextMapFilter = nextMapFilterRaw;
  if (inPlacesContext && !allowedForPlaces.includes(nextMapFilterRaw)) {
    nextMapFilter = 'all';
  } else if (inActivitiesContext && !allowedForActivities.includes(nextMapFilterRaw)) {
    nextMapFilter = 'all';
  }
  const nextSubtype = parseExploreBuddySubtype(searchParams.get('subtype'), nextMapFilter);

  return {
    mapFilter: nextMapFilter,
    activityFilter: parseActivityListFilter(searchParams.get('activity'), searchParams.get('filter')),
    panel: nextPanel,
    listOpen: parseListOpen(searchParams.get('list'), isDesktop, searchParams.get(BROWSE_DISCOVER_PARAM)),
    browseOpen: parseBrowseDiscoverOpen(searchParams.get(BROWSE_DISCOVER_PARAM)),
    query: searchParams.get('q') ?? '',
    venueFilter: parseVenueListFilter(
      searchParams.get('places'),
      searchParams.get('filter'),
      searchParams.get('activity')
    ),
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
  };
};
