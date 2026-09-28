import type { MapFilterKey } from '../routing';
import { EXPLORE_MOBILE_MAP_CHROME, EXPLORE_Z } from '../../config/exploreTheme';
import type { ExploreFilterEmojiContext } from './ExploreFilterIcon';
import { ExploreBrowseFilterChrome } from './ExploreBrowseFilterChrome';

interface ExploreMapFilterBarProps {
  mapFilter: MapFilterKey;
  onFilterChange: (filter: MapFilterKey) => void;
  activityDate: string | null;
  onActivityDateChange: (iso: string | null) => void;
  scheduledDates?: readonly string[];
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
  activityDate,
  onActivityDateChange,
  scheduledDates,
  allowedKeys,
  filterEmojiContext = 'activity',
  showDateFilter = true,
  showStateFilter = false,
  venueRegions = [],
  onVenueRegionsChange,
  className = '',
}: ExploreMapFilterBarProps) => (
  <div
    className={`pointer-events-none absolute top-3 max-lg:inset-x-0 max-lg:pl-4 lg:left-4 lg:right-4 lg:top-4 ${EXPLORE_MOBILE_MAP_CHROME.filterTop} ${EXPLORE_Z.mapFilters} ${className}`}
  >
    <div className="pointer-events-auto min-w-0 w-full">
      <ExploreBrowseFilterChrome
        mapFilter={mapFilter}
        onMapFilterChange={onFilterChange}
        allowedKeys={allowedKeys}
        filterEmojiContext={filterEmojiContext}
        layout="map"
        showDateFilter={showDateFilter}
        activityDate={activityDate}
        onActivityDateChange={onActivityDateChange}
        scheduledDates={scheduledDates}
        showStateFilter={showStateFilter}
        venueRegions={venueRegions}
        onVenueRegionsChange={onVenueRegionsChange}
      />
    </div>
  </div>
);
