import type { MapFilterKey, ExploreActivityDatePreset } from '../routing';
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
  activityDatePreset?: ExploreActivityDatePreset;
  onActivityDatePresetChange?: (preset: ExploreActivityDatePreset) => void;
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
  activityDatePreset,
  onActivityDatePresetChange,
}: Pick<
  ExploreBrowseFilterChromeProps,
  | 'showStateFilter'
  | 'showDateFilter'
  | 'venueRegions'
  | 'onVenueRegionsChange'
  | 'activityDatePreset'
  | 'onActivityDatePresetChange'
>) => {
  if (!showDateFilter && !showStateFilter) return null;

  return (
    <div className="flex shrink-0 items-center justify-end gap-2">
      {showStateFilter && onVenueRegionsChange ? (
        <VenueStateFilterMenu selected={venueRegions ?? []} onChange={onVenueRegionsChange} />
      ) : null}
      {showDateFilter && onActivityDatePresetChange ? (
        <ExploreMapDateFilter
          activityDatePreset={activityDatePreset ?? 'anyday'}
          onActivityDatePresetChange={onActivityDatePresetChange}
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
  activityDatePreset = 'anyday',
  onActivityDatePresetChange,
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
      activityDatePreset={activityDatePreset}
      onActivityDatePresetChange={onActivityDatePresetChange}
    />
  );

  const mobileShell =
    layout === 'map'
      ? 'max-lg:min-w-0'
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

      {/* Mobile map — pills full width; calendar/state on row below, right-aligned */}
      {layout === 'map' ? (
        <div className="flex flex-col gap-1.5 lg:hidden">
          {pills}
          {secondary ? <div className="flex w-full justify-end pr-0.5">{secondary}</div> : null}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 lg:hidden">
          {pills}
          <div className="flex justify-start">{secondary}</div>
        </div>
      )}
    </div>
  );
};
