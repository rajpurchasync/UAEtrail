import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import { EXPLORE_MOBILE_MAP_CHROME, EXPLORE_Z } from '../../config/exploreTheme';
import { ExploreMapMobileLayerChrome } from './ExploreMapMobileLayerChrome';
import type { ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import type { PlaceKind } from '@uaetrail/shared-types';
import type { PlaceMapTopicKey, TripMapTopicKey } from '../exploreMapQuickTopicFilters';
import type { ExplorePriceFilter, ExploreVenueFilterPatch } from '../exploreOptionalFilters';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';

type ExploreMapChromeBarProps = {
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onSearchCommit?: (scope?: ExploreSearchScopeKey | null) => void;
  searchScopeCounts?: ExploreSearchScopeCounts;
  panel: ExplorePanel;
  mapFilter: MapFilterKey;
  venueRegions: string[];
  activityDatePreset: ExploreActivityDatePreset;
  onBrowsePanelChange: (panel: ExplorePanel) => void;
  onMapFilterChange: (filter: MapFilterKey) => void;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  onVenueRegionsChange: (regions: string[]) => void;
  venueFilter?: VenueListFilterKey;
  onVenueFilterChange?: (filter: VenueListFilterKey) => void;
  tripMapTopics?: TripMapTopicKey[];
  placeMapTopics?: PlaceMapTopicKey[];
  priceFilter?: ExplorePriceFilter;
  hasTrip?: boolean;
  facilityKinds?: PlaceKind[];
  onTripTopicsChange?: (next: TripMapTopicKey[]) => void;
  onPlaceTopicsChange?: (next: PlaceMapTopicKey[]) => void;
  onPriceFilterChange?: (next: ExplorePriceFilter) => void;
  onHasTripChange?: (next: boolean) => void;
  onFacilityKindsChange?: (next: PlaceKind[]) => void;
  onVenueFiltersChange?: (next: ExploreVenueFilterPatch) => void;
  onOpenExploreSearch?: () => void;
};

/** Map toolbar — same Activities / Places browse context as the list panel. */
export const ExploreMapChromeBar = ({
  searchQuery = '',
  onSearchQueryChange,
  onSearchCommit,
  searchScopeCounts,
  panel,
  mapFilter,
  venueRegions,
  activityDatePreset,
  onBrowsePanelChange,
  onMapFilterChange,
  onActivityDatePresetChange,
  onVenueRegionsChange,
  venueFilter,
  tripMapTopics = [],
  placeMapTopics = [],
  priceFilter = 'all',
  hasTrip = false,
  facilityKinds = [],
  onTripTopicsChange,
  onPlaceTopicsChange,
  onPriceFilterChange,
  onHasTripChange,
  onFacilityKindsChange,
  onVenueFiltersChange,
  onOpenExploreSearch,
}: ExploreMapChromeBarProps) => (
  <div
    data-explore-map-chrome
    className={`pointer-events-none absolute inset-x-0 top-0 px-3 pt-2 lg:px-3 lg:pt-3 ${EXPLORE_MOBILE_MAP_CHROME.filterTop} ${EXPLORE_Z.mapFilters}`}
  >
    <div className="pointer-events-auto flex w-full max-w-none flex-col items-stretch gap-2">
      <ExploreMapMobileLayerChrome
        panel={panel}
        mapFilter={mapFilter}
        venueRegions={venueRegions}
        activityDatePreset={activityDatePreset}
        onBrowsePanelChange={onBrowsePanelChange}
        onMapFilterChange={onMapFilterChange}
        onActivityDatePresetChange={onActivityDatePresetChange}
        onVenueRegionsChange={onVenueRegionsChange}
        venueFilter={venueFilter}
        tripMapTopics={tripMapTopics}
        placeMapTopics={placeMapTopics}
        priceFilter={priceFilter}
        hasTrip={hasTrip}
        facilityKinds={facilityKinds}
        onTripTopicsChange={onTripTopicsChange}
        onPlaceTopicsChange={onPlaceTopicsChange}
        onPriceFilterChange={onPriceFilterChange}
        onHasTripChange={onHasTripChange}
        onFacilityKindsChange={onFacilityKindsChange}
        onVenueFiltersChange={onVenueFiltersChange}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        onSearchCommit={onSearchCommit}
        searchScopeCounts={searchScopeCounts}
        onOpenExploreSearch={onOpenExploreSearch}
      />
    </div>
  </div>
);
