import type { ExploreActivityDatePreset, MapFilterKey } from '../routing';
import { EXPLORE_MOBILE_MAP_CHROME, EXPLORE_Z } from '../../config/exploreTheme';
import type { ExploreFilterEmojiContext } from './ExploreFilterIcon';
import { ExploreBrowseFilterChrome } from './ExploreBrowseFilterChrome';

interface ExploreMapFilterBarProps {
  mapFilter: MapFilterKey;
  onFilterChange: (filter: MapFilterKey) => void;
  activityDatePreset: ExploreActivityDatePreset;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  allowedKeys?: readonly MapFilterKey[];
  filterEmojiContext?: ExploreFilterEmojiContext;
  showDateFilter?: boolean;
  showStateFilter?: boolean;
  venueRegions?: string[];
  onVenueRegionsChange?: (regions: string[]) => void;
  className?: string;
}

export const ExploreMapFilterBar = ({
  mapFilter,
  onFilterChange,
  activityDatePreset,
  onActivityDatePresetChange,
  allowedKeys,
  filterEmojiContext = 'activity',
  showDateFilter = true,
  showStateFilter = false,
  venueRegions = [],
  onVenueRegionsChange,
  className = '',
}: ExploreMapFilterBarProps) => (
  <div
    className={`pointer-events-none absolute top-3 max-lg:inset-x-0 max-lg:px-4 lg:left-4 lg:right-4 lg:top-4 ${EXPLORE_MOBILE_MAP_CHROME.filterTop} ${EXPLORE_Z.mapFilters} ${className}`}
  >
    <div className="pointer-events-auto min-w-0 w-full">
      <ExploreBrowseFilterChrome
        mapFilter={mapFilter}
        onMapFilterChange={onFilterChange}
        allowedKeys={allowedKeys}
        filterEmojiContext={filterEmojiContext}
        layout="map"
        showDateFilter={showDateFilter}
        activityDatePreset={activityDatePreset}
        onActivityDatePresetChange={onActivityDatePresetChange}
        showStateFilter={showStateFilter}
        venueRegions={venueRegions}
        onVenueRegionsChange={onVenueRegionsChange}
      />
    </div>
  </div>
);
