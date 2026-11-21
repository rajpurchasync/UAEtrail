import type { ActivityListFilterKey, ExploreActivityDatePreset, ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import type { ExploreMapFilterPillKey, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import type { ExploreActivityModeFilter } from '../exploreActivityModeFilter';
import type { ExploreBuddySubtypeKey } from '../exploreBuddySubtype';
import type { ExploreOutingTopicKey } from '../exploreOutingTopic';
import type { ExplorePinKindFilter } from '../explorePinKindFilter';
import type { ExploreBrowseListMode } from '../exploreBrowseUrlSync';
import type { ExplorePriceFilter } from '../exploreOptionalFilters';
import type { PlaceMapTopicKey, TripMapTopicKey } from '../exploreMapQuickTopicFilters';
import type { PlaceKind } from '@uaetrail/shared-types';
import type { PeopleBrowseTab } from '@/people-discovery/peopleBrowseTab';
import type { DesktopBrowseTab } from './exploreBrowsePanelCopy';

export type ExploreBrowseUrlBrowseSetters = ReturnType<typeof createExploreBrowseUrlBrowseSetters>;

export const createExploreBrowseUrlBrowseSetters = (input: {
  setMapFilter: (v: MapFilterKey) => void;
  setActivityFilter: (v: ActivityListFilterKey) => void;
  setVenueFilter: (v: VenueListFilterKey) => void;
  setPanel: (v: ExplorePanel) => void;
  setListOpen: (v: boolean) => void;
  setBrowseOpen: (v: boolean) => void;
  setBuddySubtype: (v: ExploreBuddySubtypeKey) => void;
  setOutingTopic: (v: ExploreOutingTopicKey) => void;
  setPinKind: (v: ExplorePinKindFilter) => void;
  setTopicPills: (v: ExploreMapFilterPillKey[]) => void;
  setListMode: (v: ExploreBrowseListMode) => void;
  setPeopleBrowseOpen: (v: boolean) => void;
  setPeopleBrowseTab: (v: PeopleBrowseTab) => void;
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
  setQuery: (v: string) => void;
  setSearchExpanded: (v: boolean) => void;
}) => ({
  setMapFilter: input.setMapFilter,
  setActivityFilter: input.setActivityFilter,
  setVenueFilter: input.setVenueFilter,
  setPanel: input.setPanel,
  setListOpen: input.setListOpen,
  setBrowseOpen: input.setBrowseOpen,
  setBuddySubtype: input.setBuddySubtype,
  setOutingTopic: input.setOutingTopic,
  setPinKind: input.setPinKind,
  setTopicPills: input.setTopicPills,
  setListMode: input.setListMode,
  setPeopleBrowseOpen: input.setPeopleBrowseOpen,
  setPeopleBrowseTab: input.setPeopleBrowseTab,
  setDesktopBrowseTab: input.setDesktopBrowseTab,
  setActivityDatePreset: input.setActivityDatePreset,
  setActivityModeFilter: input.setActivityModeFilter,
  setVenueRegions: input.setVenueRegions,
  setGeoPath: input.setGeoPath,
  setSearchScope: input.setSearchScope,
  setTripMapTopics: input.setTripMapTopics,
  setPlaceMapTopics: input.setPlaceMapTopics,
  setPriceFilter: input.setPriceFilter,
  setHasTrip: input.setHasTrip,
  setFacilityKinds: input.setFacilityKinds,
  setQuery: input.setQuery,
  setSearchExpanded: input.setSearchExpanded,
});