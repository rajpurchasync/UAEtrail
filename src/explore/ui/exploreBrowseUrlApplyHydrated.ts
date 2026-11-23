import type { PlaceKind } from '@uaetrail/shared-types';
import type {
  ActivityListFilterKey,
  ExploreActivityDatePreset,
  ExplorePanel,
  MapFilterKey,
  VenueListFilterKey,
} from '../routing';
import type { ExploreBrowseUrlHydratedState } from '../exploreBrowseUrlHydrate';
import type { ExploreMapFilterPillKey, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import type { ExploreBrowseListMode } from '../exploreBrowseUrlSync';
import type { ExploreActivityModeFilter } from '../exploreActivityModeFilter';
import type { ExploreOthersSubtypeKey } from '../exploreOthersSubtype';
import type { ExploreOutingTopicKey } from '../exploreOutingTopic';
import type { ExplorePinKindFilter } from '../explorePinKindFilter';
import type { CrewBrowseLane, CrewPeopleFacet, CrewProfessionalKind } from '@/crew-discovery/crewBrowseState';
import type { PlaceMapTopicKey, TripMapTopicKey } from '../exploreMapQuickTopicFilters';
import type { ExplorePriceFilter } from '../exploreOptionalFilters';
import type { DesktopBrowseTab } from './exploreBrowsePanelCopy';

export type ExploreBrowseUrlSetterBundle = {
  setMapFilter: (v: MapFilterKey) => void;
  setActivityFilter: (v: ActivityListFilterKey) => void;
  setVenueFilter: (v: VenueListFilterKey) => void;
  setPanel: (v: ExplorePanel) => void;
  setListOpen: (v: boolean) => void;
  setBrowseOpen: (v: boolean) => void;
  setQuery: (v: string) => void;
  setVenueRegions: (v: string[]) => void;
  setGeoPath: (v: string[]) => void;
  setActivityDatePreset: (v: ExploreActivityDatePreset) => void;
  setActivityModeFilter: (v: ExploreActivityModeFilter) => void;
  setOthersSubtype: (v: ExploreOthersSubtypeKey) => void;
  setOutingTopic: (v: ExploreOutingTopicKey) => void;
  setPinKind: (v: ExplorePinKindFilter) => void;
  setTopicPills: (v: ExploreMapFilterPillKey[]) => void;
  setListMode: (v: ExploreBrowseListMode) => void;
  setCrewsBrowseOpen: (v: boolean) => void;
  setSearchScope: (v: ExploreSearchScopeKey | null) => void;
  setCrewBrowseLane: (v: CrewBrowseLane) => void;
  setCrewPeopleFacet: (v: CrewPeopleFacet) => void;
  setCrewProfessionalKind: (v: CrewProfessionalKind) => void;
  setTripMapTopics: (v: TripMapTopicKey[]) => void;
  setPlaceMapTopics: (v: PlaceMapTopicKey[]) => void;
  setPriceFilter: (v: ExplorePriceFilter) => void;
  setHasTrip: (v: boolean) => void;
  setFacilityKinds: (v: PlaceKind[]) => void;
  setDesktopBrowseTab: (v: DesktopBrowseTab) => void;
  setSearchExpanded: (v: boolean) => void;
};

export const applyExploreBrowseHydratedState = (
  setters: ExploreBrowseUrlSetterBundle,
  state: ExploreBrowseUrlHydratedState,
  isDesktop: boolean
): void => {
  setters.setMapFilter(state.mapFilter);
  setters.setActivityFilter(state.activityFilter);
  setters.setVenueFilter(state.venueFilter);
  setters.setPanel(state.panel);
  setters.setListOpen(state.listOpen);
  setters.setBrowseOpen(state.browseOpen);
  setters.setQuery(state.query);
  setters.setVenueRegions(state.venueRegions);
  setters.setGeoPath(state.geoPath);
  setters.setActivityDatePreset(state.activityDatePreset);
  setters.setActivityModeFilter(state.activityModeFilter);
  setters.setOthersSubtype(state.othersSubtype);
  setters.setOutingTopic(state.outingTopic);
  setters.setPinKind(state.pinKind);
  setters.setTopicPills(state.topicPills);
  setters.setListMode(state.listMode);
  setters.setCrewsBrowseOpen(state.crewsBrowseOpen);
  setters.setSearchScope(state.searchScope);
  setters.setCrewBrowseLane(state.crewBrowseLane);
  setters.setCrewPeopleFacet(state.crewPeopleFacet);
  setters.setCrewProfessionalKind(state.crewProfessionalKind);
  setters.setTripMapTopics(state.tripMapTopics);
  setters.setPlaceMapTopics(state.placeMapTopics);
  setters.setPriceFilter(state.priceFilter);
  setters.setHasTrip(state.hasTrip);
  setters.setFacilityKinds([...state.facilityKinds]);
  if (isDesktop) {
    setters.setDesktopBrowseTab(state.desktopBrowseTab);
    if (state.expandSearch) setters.setSearchExpanded(true);
  }
};