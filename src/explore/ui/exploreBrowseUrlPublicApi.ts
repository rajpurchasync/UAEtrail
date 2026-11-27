import type { ActivityListFilterKey, ExploreActivityDatePreset, ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import type { ExploreMapFilterPillKey, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import type { ExploreActivityModeFilter } from '../exploreActivityModeFilter';
import type { ExploreOthersSubtypeKey } from '../exploreOthersSubtype';
import type { ExploreOutingTopicKey } from '../exploreOutingTopic';
import type { ExplorePinKindFilter } from '../explorePinKindFilter';
import type { ExploreBrowseListMode } from '../exploreBrowseUrlSync';
import type { ExplorePriceFilter } from '../exploreOptionalFilters';
import type { PlaceMapTopicKey, TripMapTopicKey } from '../exploreMapQuickTopicFilters';
import type { PlaceKind } from '@uaetrail/shared-types';
import type { CrewBrowseLane, CrewPeopleFacet } from '@/crew-discovery/crewBrowseState';
import type { DesktopBrowseTab } from './exploreBrowsePanelCopy';
import { UNIFIED_MAP_FILTER_KEYS } from './exploreBrowseUrlConstants';
import type { useExploreBrowseUrlApplyHandlers } from './useExploreBrowseUrlApplyHandlers';
import type { DiscoveryBrowseListSessionSnapshot } from '../../discovery/discoveryBrowseListSessionRead';

type Handlers = ReturnType<typeof useExploreBrowseUrlApplyHandlers>;

export type ExploreBrowseUrlPublicApiContext = {
  listBrowseSession: DiscoveryBrowseListSessionSnapshot | null;
  mapFilter: MapFilterKey;
  setMapFilter: (v: MapFilterKey) => void;
  activityFilter: ActivityListFilterKey;
  setActivityFilter: (v: ActivityListFilterKey) => void;
  panel: ExplorePanel;
  listOpen: boolean;
  setListOpen: (v: boolean) => void;
  query: string;
  setQuery: (v: string) => void;
  venueFilter: VenueListFilterKey;
  venueRegions: string[];
  geoPath: string[];
  desktopBrowseTab: DesktopBrowseTab;
  searchExpanded: boolean;
  setSearchExpanded: (v: boolean) => void;
  activityDatePreset: ExploreActivityDatePreset;
  activityModeFilter: ExploreActivityModeFilter;
  syncExploreUrl: (patch: import('../exploreBrowseUrlSync').ExploreBrowseUrlSyncPatch) => void;
  browseOpen: boolean;
  othersSubtype: ExploreOthersSubtypeKey;
  outingTopic: ExploreOutingTopicKey;
  searchScope: ExploreSearchScopeKey | null;
  pinKind: ExplorePinKindFilter;
  topicPills: ExploreMapFilterPillKey[];
  crewBrowseLane: CrewBrowseLane;
  crewPeopleFacet: CrewPeopleFacet;
  listMode: ExploreBrowseListMode;
  crewsBrowseOpen: boolean;
  tripMapTopics: TripMapTopicKey[];
  placeMapTopics: PlaceMapTopicKey[];
  priceFilter: ExplorePriceFilter;
  hasTrip: boolean;
  facilityKinds: PlaceKind[];
  handlers: Handlers;
  openListExplorer: () => void;
  showListPanel: boolean;
  showDesktopCatalogDrawer: boolean;
  sidebarPanel: ExplorePanel;
  desktopFilterKeys: MapFilterKey[];
  browseFilterKeys: MapFilterKey[];
  placesMode: boolean;
};

export const buildExploreBrowseUrlPublicApi = (ctx: ExploreBrowseUrlPublicApiContext) => ({
  listBrowseSession: ctx.listBrowseSession,
  listCat: ctx.listBrowseSession?.listCat ?? null,
  mapFilter: ctx.mapFilter,
  setMapFilter: ctx.setMapFilter,
  activityFilter: ctx.activityFilter,
  setActivityFilter: ctx.setActivityFilter,
  panel: ctx.panel,
  listOpen: ctx.listOpen,
  setListOpen: ctx.setListOpen,
  query: ctx.query,
  setQuery: ctx.setQuery,
  venueFilter: ctx.venueFilter,
  venueRegions: ctx.venueRegions,
  geoPath: ctx.geoPath,
  desktopBrowseTab: ctx.desktopBrowseTab,
  searchExpanded: ctx.searchExpanded,
  setSearchExpanded: ctx.setSearchExpanded,
  activityDatePreset: ctx.activityDatePreset,
  applyActivityDatePreset: ctx.handlers.applyActivityDatePreset,
  activityModeFilter: ctx.activityModeFilter,
  applyActivityModeFilter: ctx.handlers.applyActivityModeFilter,
  syncExploreUrl: ctx.syncExploreUrl,
  applyMapFilter: ctx.handlers.applyMapFilter,
  applyDesktopBrowseTab: ctx.handlers.applyDesktopBrowseTab,
  applyActivityFilter: ctx.handlers.applyActivityFilter,
  applyPanel: ctx.handlers.applyPanel,
  applyVenueFilter: ctx.handlers.applyVenueFilter,
  applyBrowsePanel: ctx.handlers.applyBrowsePanel,
  openBrowse: ctx.openListExplorer,
  openMapListPanel: ctx.openListExplorer,
  openDiscoverBrowse: ctx.openListExplorer,
  closeDiscoverBrowse: ctx.handlers.closeDiscoverBrowse,
  browseOpen: ctx.browseOpen,
  closeListPanel: ctx.handlers.closeListPanel,
  showListPanel: ctx.showListPanel,
  showDesktopCatalogDrawer: ctx.showDesktopCatalogDrawer,
  sidebarPanel: ctx.sidebarPanel,
  desktopFilterKeys: ctx.desktopFilterKeys,
  browseFilterKeys: ctx.browseFilterKeys,
  placesMode: ctx.placesMode,
  applyVenueRegions: ctx.handlers.applyVenueRegions,
  applyGeoPath: ctx.handlers.applyGeoPath,
  othersSubtype: ctx.othersSubtype,
  applyBuddySubtype: ctx.handlers.applyBuddySubtype,
  outingTopic: ctx.outingTopic,
  applyOutingTopic: ctx.handlers.applyOutingTopic,
  searchScope: ctx.searchScope,
  commitExploreSearch: ctx.handlers.commitExploreSearch,
  pinKind: ctx.pinKind,
  applyPinKindFilter: ctx.handlers.applyPinKindFilter,
  mapFilterKeys: UNIFIED_MAP_FILTER_KEYS,
  topicPills: ctx.topicPills,
  toggleMapTopicPill: ctx.handlers.toggleMapTopicPill,
  clearMapTopicPills: ctx.handlers.clearMapTopicPills,
  openCrewsBrowsePanel: ctx.handlers.openCrewsBrowsePanel,
  closeCrewsBrowsePanel: ctx.handlers.closeCrewsBrowsePanel,
  crewBrowseLane: ctx.crewBrowseLane,
  crewPeopleFacet: ctx.crewPeopleFacet,
  applyCrewBrowseLane: ctx.handlers.applyCrewBrowseLane,
  applyCrewPeopleFacet: ctx.handlers.applyCrewPeopleFacet,
  listMode: ctx.listMode,
  crewsBrowseOpen: ctx.crewsBrowseOpen,
  tripMapTopics: ctx.tripMapTopics,
  placeMapTopics: ctx.placeMapTopics,
  priceFilter: ctx.priceFilter,
  hasTrip: ctx.hasTrip,
  facilityKinds: ctx.facilityKinds,
  applyTripMapTopics: ctx.handlers.applyTripMapTopics,
  applyPlaceMapTopics: ctx.handlers.applyPlaceMapTopics,
  applyPriceFilter: ctx.handlers.applyPriceFilter,
  applyHasTrip: ctx.handlers.applyHasTrip,
  applyFacilityKinds: ctx.handlers.applyFacilityKinds,
  applyVenueFilters: ctx.handlers.applyVenueFilters,
  toggleTripMapTopic: ctx.handlers.toggleTripMapTopic,
  togglePlaceMapTopic: ctx.handlers.togglePlaceMapTopic,
});