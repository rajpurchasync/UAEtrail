import type { MapFilterKey } from '../routing';
import type { ExploreFilterEmojiContext } from './ExploreFilterIcon';
import { ExploreFilterPillsRow } from './ExploreFilterPillsRow';
import { ExploreMapDateFilter } from './ExploreMapDateFilter';
import { VenueStateFilterMenu } from './VenueStateFilterMenu';

export type ExploreBrowseFilterChromeProps = {
  mapFilter: MapFilterKey;
  onMapFilterChange: (filter: MapFilterKey) => void;
  allowedKeys?: readonly MapFilterKey[];
  filterEmojiContext?: ExploreFilterEmojiContext;
  layout: 'map' | 'list';
  showDateFilter?: boolean;
  activityDate?: string | null;
  onActivityDateChange?: (iso: string | null) => void;
  scheduledDates?: readonly string[];
  showStateFilter?: boolean;
  venueRegions?: string[];
  onVenueRegionsChange?: (regions: string[]) => void;
  className?: string;
};

const SecondaryFilters = ({
  showStateFilter,
  showDateFilter,
  venueRegions,
  onVenueRegionsChange,
  activityDate,
  onActivityDateChange,
  scheduledDates,
}: Pick<
  ExploreBrowseFilterChromeProps,
  | 'showStateFilter'
  | 'showDateFilter'
  | 'venueRegions'
  | 'onVenueRegionsChange'
  | 'activityDate'
  | 'onActivityDateChange'
  | 'scheduledDates'
>) => {
  if (!showDateFilter && !showStateFilter) return null;

  return (
    <div className="flex shrink-0 items-center justify-start gap-2">
      {showStateFilter && onVenueRegionsChange ? (
        <VenueStateFilterMenu selected={venueRegions ?? []} onChange={onVenueRegionsChange} />
      ) : null}
      {showDateFilter && onActivityDateChange ? (
        <ExploreMapDateFilter
          activityDate={activityDate ?? null}
          onActivityDateChange={onActivityDateChange}
          scheduledDates={scheduledDates}
        />
      ) : null}
    </div>
  );
};

/** Category pills; date on map beside pills (desktop) or below pills (mobile). List panel date is on the search row (desktop). */
export const ExploreBrowseFilterChrome = ({
  mapFilter,
  onMapFilterChange,
  allowedKeys,
  filterEmojiContext = 'activity',
  layout,
  showDateFilter = false,
  activityDate = null,
  onActivityDateChange,
  scheduledDates,
  showStateFilter = false,
  venueRegions = [],
  onVenueRegionsChange,
  className = '',
}: ExploreBrowseFilterChromeProps) => {
  const pills = (
    <ExploreFilterPillsRow
      mapFilter={mapFilter}
      onFilterChange={onMapFilterChange}
      allowedKeys={allowedKeys}
      filterEmojiContext={filterEmojiContext}
      layout={layout}
    />
  );

  const secondary = (
    <SecondaryFilters
      showStateFilter={showStateFilter}
      showDateFilter={showDateFilter}
      venueRegions={venueRegions}
      onVenueRegionsChange={onVenueRegionsChange}
      activityDate={activityDate}
      onActivityDateChange={onActivityDateChange}
      scheduledDates={scheduledDates}
    />
  );

  const mobileShell =
    layout === 'map'
      ? 'max-lg:sticky max-lg:top-0 max-lg:z-10 max-lg:rounded-2xl max-lg:bg-white/92 max-lg:px-1 max-lg:py-1 max-lg:shadow-[0_2px_12px_rgba(15,23,42,.08)] max-lg:backdrop-blur-sm'
      : 'max-lg:sticky max-lg:top-0 max-lg:z-20 max-lg:-mx-1 max-lg:bg-[#f8fafb]/95 max-lg:px-1 max-lg:pb-2 max-lg:pt-0.5 max-lg:backdrop-blur-sm';

  return (
    <div className={`${mobileShell} ${className}`}>
      {/* Desktop — map: date/state beside last pill; list: pills only (date lives on search in panel) */}
      <div className="hidden min-w-0 items-center gap-2 lg:flex">
        <div
          className={
            layout === 'map' ? 'min-w-0 max-w-full overflow-hidden' : 'min-w-0 flex-1 overflow-hidden'
          }
        >
          {pills}
        </div>
        {layout === 'map' ? secondary : showStateFilter ? secondary : null}
      </div>

      {/* Mobile — pills, then calendar/state aligned right (sticky with shell) */}
      <div className="flex flex-col gap-1.5 lg:hidden">
        {pills}
        {secondary}
      </div>
    </div>
  );
};
