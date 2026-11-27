import type { NavigateFunction } from 'react-router-dom';
import type {
  ActivityListFilterKey,
  ExploreActivityDatePreset,
  ExplorePanel,
  MapFilterKey,
  VenueListFilterKey,
} from '../../routing';
import type { DesktopBrowseTab } from '../exploreBrowsePanelCopy';
import type { ExploreMapFilterPillKey, ExploreSearchScopeKey } from '../../exploreBrowseTaxonomy';
import type { ExploreBrowseUrlSyncPatch } from '../../exploreBrowseUrlSync';
import type { CrewBrowseLane, CrewPeopleFacet } from '@/crew-discovery/crewBrowseState';
import type { ExplorePinKindFilter } from '../../explorePinKindFilter';
import type { ExploreActivityModeFilter } from '../../exploreActivityModeFilter';
import type { ExploreOthersSubtypeKey } from '../../exploreOthersSubtype';
import type { ExploreOutingTopicKey } from '../../exploreOutingTopic';
import type { ExploreBrowseListMode } from '../../exploreBrowseUrlSync';
import type { PlaceKind } from '@uaetrail/shared-types';
import type { ExplorePriceFilter } from '../../exploreOptionalFilters';
import type { PlaceMapTopicKey, TripMapTopicKey } from '../../exploreMapQuickTopicFilters';

export type SyncExploreUrl = (patch: ExploreBrowseUrlSyncPatch) => void;

export type ExploreBrowseUrlSetters = {
  setMapFilter: (v: MapFilterKey) => void;
  setActivityFilter: (v: ActivityListFilterKey) => void;
  setVenueFilter: (v: VenueListFilterKey) => void;
  setPanel: (v: ExplorePanel) => void;
  setListOpen: (v: boolean) => void;
  setBrowseOpen: (v: boolean) => void;
  setOthersSubtype: (v: ExploreOthersSubtypeKey) => void;
  setOutingTopic: (v: ExploreOutingTopicKey) => void;
  setPinKind: (v: ExplorePinKindFilter) => void;
  setTopicPills: (v: ExploreMapFilterPillKey[]) => void;
  setListMode: (v: ExploreBrowseListMode) => void;
  setCrewsBrowseOpen: (v: boolean) => void;
  setCrewBrowseLane: (v: CrewBrowseLane) => void;
  setCrewPeopleFacet: (v: CrewPeopleFacet) => void;
  setDesktopBrowseTab: (v: DesktopBrowseTab) => void;
  setActivityDatePreset: (v: ExploreActivityDatePreset) => void;
  setActivityModeFilter: (v: ExploreActivityModeFilter) => void;
  setVenueRegions: (v: string[]) => void;
  setGeoPath: (v: string[]) => void;
  setSearchScope: (v: ExploreSearchScopeKey | null) => void;
  setTripMapTopics: (v: TripMapTopicKey[]) => void;
  setPlaceMapTopics: (v: PlaceMapTopicKey[]) => void;
  setPriceFilter: (v: ExplorePriceFilter) => void;
  setHasTrip: (v: boolean) => void;
  setFacilityKinds: (v: PlaceKind[]) => void;
};

export type UseExploreBrowseUrlApplyHandlersArgs = {
  isDesktop: boolean;
  isSignedIn: boolean;
  navigate: NavigateFunction;
  clearSelection: () => void;
  syncExploreUrl: SyncExploreUrl;
  listOpen: boolean;
  browseOpen: boolean;
  panel: ExplorePanel;
  mapFilter: MapFilterKey;
  othersSubtype: ExploreOthersSubtypeKey;
  outingTopic: ExploreOutingTopicKey;
  topicPills: ExploreMapFilterPillKey[];
  tripMapTopics: TripMapTopicKey[];
  placeMapTopics: PlaceMapTopicKey[];
  activityFilter: ActivityListFilterKey;
  venueFilter: VenueListFilterKey;
  query: string;
  searchScope: ExploreSearchScopeKey | null;
  listMode: ExploreBrowseListMode;
  exploreReturnPath: string;
  setters: ExploreBrowseUrlSetters;
};