import type { PlaceKind } from '@uaetrail/shared-types';
import { Search } from 'lucide-react';
import type { ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import type { PlaceMapTopicKey, TripMapTopicKey } from '../exploreMapQuickTopicFilters';
import {
  aliasListPlaceTopicToMap,
  type ExplorePriceFilter,
  type ExploreVenueFilterPatch,
} from '../exploreOptionalFilters';
import type { BrowseTripTopicKey } from '../../list/browseListTripTopics';
import type { ListVenuePlaceTopicKey } from '../../list/listVenuePlaceTopics';
import { ListExplorerGeoScopeChip } from '../../list/explorer/ListExplorerGeoScopeChip';
import { ListExplorerQuickFilters } from '../../list/explorer/ListExplorerQuickFilters';
import { EXPLORE_MAP_CHROME_FROST } from '../../config/exploreTheme';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import {
  exploreMapQuickFiltersBrowseState,
  explorePanelToBrowseListBucket,
} from './exploreMapQuickFiltersState';
import { ExploreMapProjectionToggle } from './ExploreMapProjectionToggle';

const SCOPE_ROW = 'flex h-8 min-w-0 items-center gap-2';

type ExploreMapMobileLayerChromeProps = {
  panel: ExplorePanel;
  mapFilter: MapFilterKey;
  venueRegions: string[];
  activityDatePreset: ExploreActivityDatePreset;
  onMapFilterChange: (filter: MapFilterKey) => void;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  onVenueRegionsChange: (regions: string[]) => void;
  geoPath?: readonly string[];
  onClearGeoScope?: () => void;
  onPopGeoScope?: () => void;
  venueFilter?: VenueListFilterKey;
  tripMapTopics: TripMapTopicKey[];
  placeMapTopics: PlaceMapTopicKey[];
  priceFilter: ExplorePriceFilter;
  hasTrip: boolean;
  facilityKinds: PlaceKind[];
  onTripTopicsChange: (next: TripMapTopicKey[]) => void;
  onPlaceTopicsChange: (next: PlaceMapTopicKey[]) => void;
  onPriceFilterChange: (next: ExplorePriceFilter) => void;
  onHasTripChange: (next: boolean) => void;
  onFacilityKindsChange: (next: PlaceKind[]) => void;
  onVenueFiltersChange: (next: ExploreVenueFilterPatch) => void;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onSearchCommit?: (scope?: ExploreSearchScopeKey | null) => void;
  searchScopeCounts?: ExploreSearchScopeCounts;
  onOpenExploreSearch?: () => void;
  catalogListCount: number;
  projectionMode: 'map' | 'list';
  onSelectMapView: () => void;
  onSelectListView: () => void;
};

export const ExploreMapMobileLayerChrome = ({
  panel,
  mapFilter,
  venueRegions,
  activityDatePreset,
  onActivityDatePresetChange,
  onVenueRegionsChange,
  geoPath = [],
  onClearGeoScope,
  onPopGeoScope,
  tripMapTopics,
  placeMapTopics,
  priceFilter,
  hasTrip,
  facilityKinds,
  onTripTopicsChange,
  onPlaceTopicsChange,
  onPriceFilterChange,
  onHasTripChange,
  onFacilityKindsChange,
  onVenueFiltersChange,
  onOpenExploreSearch,
  catalogListCount,
  projectionMode,
  onSelectMapView,
  onSelectListView,
}: ExploreMapMobileLayerChromeProps) => {
  const filters = exploreMapQuickFiltersBrowseState({
    tripMapTopics,
    placeMapTopics,
    priceFilter,
    hasTrip,
    facilityKinds,
    activityDatePreset,
  });

  const commitListPlaceTopics = (next: ListVenuePlaceTopicKey[]) => {
    const mapped = next
      .map(aliasListPlaceTopicToMap)
      .filter((key): key is PlaceMapTopicKey => key != null);
    onPlaceTopicsChange(mapped);
  };

  const commitListVenueFilters = (next: {
    placeTopics: ListVenuePlaceTopicKey[];
    facilityKinds: PlaceKind[];
  }) => {
    const mappedTopics = next.placeTopics
      .map(aliasListPlaceTopicToMap)
      .filter((key): key is PlaceMapTopicKey => key != null);
    onVenueFiltersChange({ placeTopics: mappedTopics, facilityKinds: next.facilityKinds });
  };

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-2">
      <div className={SCOPE_ROW}>
        <ExploreMapProjectionToggle
          mode={projectionMode}
          listCount={catalogListCount}
          onSelectMap={onSelectMapView}
          onSelectList={onSelectListView}
        />
        {onOpenExploreSearch ? (
          <button
            type="button"
            className={`ml-auto inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-neutral-900 ring-1 ring-black/5 ${EXPLORE_MAP_CHROME_FROST}`}
            aria-label="Search explore"
            onClick={() => onOpenExploreSearch()}
          >
            <Search className="h-4 w-4 shrink-0 text-neutral-800" strokeWidth={2.25} aria-hidden />
            <span>Search</span>
          </button>
        ) : null}
      </div>

      {geoPath.length > 0 && onClearGeoScope ? (
        <ListExplorerGeoScopeChip
          geoPath={geoPath}
          onClear={onClearGeoScope}
          onPopLevel={onPopGeoScope}
        />
      ) : null}

      <ListExplorerQuickFilters
        bucket={explorePanelToBrowseListBucket(panel)}
        filters={filters}
        regions={venueRegions}
        onTripTopicsChange={(next: BrowseTripTopicKey[]) => onTripTopicsChange(next)}
        onPlaceTopicsChange={commitListPlaceTopics}
        onPriceChange={onPriceFilterChange}
        onHasTripChange={onHasTripChange}
        onFacilityKindsChange={onFacilityKindsChange}
        onVenueFiltersChange={commitListVenueFilters}
        onActivityDatePresetChange={onActivityDatePresetChange}
        onVenueRegionsChange={onVenueRegionsChange}
      />
    </div>
  );
};