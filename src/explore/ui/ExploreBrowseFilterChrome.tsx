import { useCallback, useEffect, useState } from 'react';
import type { MapFilterKey, ExploreActivityDatePreset } from '../routing';
import type { ExploreFilterEmojiContext } from './ExploreFilterIcon';
import type { ExploreBuddySubtypeKey } from '../exploreBuddySubtype';
import type { ExploreOutingTopicKey } from '../exploreOutingTopic';
import { ExploreBuddySubtypePillsRow } from './ExploreBuddySubtypePillsRow';
import { ExploreOutingTopicPillsRow } from './ExploreOutingTopicPillsRow';
import { ExploreFilterPillsRow } from './ExploreFilterPillsRow';
import { ExploreMapDateFilter } from './ExploreMapDateFilter';
import { VenueStateFilterMenu } from './VenueStateFilterMenu';
import { ExplorePinKindPillsRow } from './ExplorePinKindPillsRow';
import type { ExplorePinKindFilter } from '../explorePinKindFilter';
import { ExploreActivityModePillsRow } from './ExploreActivityModePillsRow';
import type { ExploreActivityModeFilter } from '../exploreActivityModeFilter';
import { ExploreBrowseListRegionPillsRow } from './ExploreBrowseListRegionPillsRow';

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
  buddySubtype?: ExploreBuddySubtypeKey;
  onBuddySubtypeChange?: (subtype: ExploreBuddySubtypeKey) => void;
  outingTopic?: ExploreOutingTopicKey;
  onOutingTopicChange?: (topic: ExploreOutingTopicKey) => void;
  /** Map: one topic row + pin-kind row for plans and places together. */
  unifiedMapChrome?: boolean;
  pinKind?: ExplorePinKindFilter;
  onPinKindChange?: (pinKind: ExplorePinKindFilter) => void;
  activityModeFilter?: ExploreActivityModeFilter;
  onActivityModeFilterChange?: (filter: ExploreActivityModeFilter) => void;
  className?: string;
};

const SecondaryFilters = ({
  showStateFilter,
  showDateFilter,
  venueRegions,
  onVenueRegionsChange,
  activityDatePreset,
  onActivityDatePresetChange,
  dateFilterIncludeAnyday,
}: Pick<
  ExploreBrowseFilterChromeProps,
  | 'showStateFilter'
  | 'showDateFilter'
  | 'venueRegions'
  | 'onVenueRegionsChange'
  | 'activityDatePreset'
  | 'onActivityDatePresetChange'
> & { dateFilterIncludeAnyday?: boolean }) => {
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
          includeAnyday={dateFilterIncludeAnyday ?? true}
        />
      ) : null}
    </div>
  );
};

/** Category pills; map chrome shows date/state beside or below pills. List panel date/state sit on the search row (all breakpoints). */
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
  buddySubtype = 'all',
  onBuddySubtypeChange,
  outingTopic = 'all',
  onOutingTopicChange,
  unifiedMapChrome = false,
  pinKind = 'all',
  onPinKindChange,
  activityModeFilter = 'all',
  onActivityModeFilterChange,
  className = '',
}: ExploreBrowseFilterChromeProps) => {
  const [listRegionStep, setListRegionStep] = useState(false);
  const listShowRegionStep = layout === 'list' && listRegionStep && mapFilter !== 'all';

  useEffect(() => {
    if (mapFilter === 'all') setListRegionStep(false);
  }, [mapFilter]);

  const handleListMapFilterChange = useCallback(
    (filter: MapFilterKey) => {
      onMapFilterChange(filter);
      if (filter === 'all') {
        setListRegionStep(false);
        return;
      }
      setListRegionStep(true);
    },
    [onMapFilterChange]
  );

  const unifiedMap = unifiedMapChrome && layout === 'map';
  const showBuddySubtype =
    (unifiedMap || filterEmojiContext !== 'venue') &&
    mapFilter === 'others' &&
    onBuddySubtypeChange != null;
  const showOutingTopic =
    showBuddySubtype && buddySubtype === 'activities' && onOutingTopicChange != null;
  const showPinKindRow = unifiedMap && onPinKindChange != null;
  const mapShowsPlans = pinKind === 'all' || pinKind === 'activities' || pinKind === 'looking';
  const mapShowsPlaces = pinKind === 'all' || pinKind === 'places' || pinKind === 'locations';
  const showActivityModeRow =
    layout === 'map' &&
    onActivityModeFilterChange != null &&
    filterEmojiContext !== 'venue' &&
    (unifiedMap ? mapShowsPlans : true);
  const activityModeRow = showActivityModeRow ? (
    <ExploreActivityModePillsRow
      value={activityModeFilter}
      onChange={onActivityModeFilterChange}
      layout={layout}
    />
  ) : null;
  const effectiveShowDate =
    unifiedMap ? mapShowsPlans && showDateFilter : showDateFilter;
  const effectiveShowState =
    unifiedMap ? mapShowsPlaces && showStateFilter : showStateFilter;
  const pinKindRow = showPinKindRow ? (
    <ExplorePinKindPillsRow pinKind={pinKind} onPinKindChange={onPinKindChange!} layout={layout} />
  ) : null;
  const pills = (
    <ExploreFilterPillsRow
      mapFilter={mapFilter}
      onFilterChange={layout === 'list' ? handleListMapFilterChange : onMapFilterChange}
      allowedKeys={allowedKeys}
      filterEmojiContext={filterEmojiContext}
      layout={layout}
    />
  );

  const listMobilePills = (
    <div className="relative min-h-[40px] overflow-hidden">
      <div
        className={`absolute inset-0 transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
          listShowRegionStep
            ? 'pointer-events-none -translate-x-4 opacity-0'
            : 'translate-x-0 opacity-100'
        }`}
        aria-hidden={listShowRegionStep}
      >
        {pills}
      </div>
      <div
        className={`absolute inset-0 transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
          listShowRegionStep
            ? 'translate-x-0 opacity-100'
            : 'pointer-events-none translate-x-6 opacity-0'
        }`}
        aria-hidden={!listShowRegionStep}
      >
        {onVenueRegionsChange ? (
          <ExploreBrowseListRegionPillsRow
            venueRegions={venueRegions}
            onVenueRegionsChange={onVenueRegionsChange}
            mapFilter={mapFilter}
            filterEmojiContext={filterEmojiContext}
            onBackToCategoryFilters={() => setListRegionStep(false)}
          />
        ) : null}
      </div>
    </div>
  );

  const secondary = (
    <SecondaryFilters
      showStateFilter={effectiveShowState}
      showDateFilter={effectiveShowDate}
      venueRegions={venueRegions}
      onVenueRegionsChange={onVenueRegionsChange}
      activityDatePreset={activityDatePreset}
      onActivityDatePresetChange={onActivityDatePresetChange}
      dateFilterIncludeAnyday={layout !== 'map'}
    />
  );

  const mobileShell =
    layout === 'map'
      ? 'max-lg:min-w-0'
      : 'max-lg:sticky max-lg:top-0 max-lg:z-20 max-lg:bg-[#f8fafb]/95 max-lg:pb-1 max-lg:pt-0 max-lg:backdrop-blur-sm';

  return (
    <div className={`${mobileShell} ${className}`}>
      {/* Desktop — map: date/state beside last pill; list: pills only (date/state on search row in panel) */}
      <div className="hidden min-w-0 flex-col gap-1.5 lg:flex">
        <div className="flex min-w-0 items-center gap-2">
          <div className={layout === 'list' ? 'min-w-0 flex-1' : 'min-w-0 flex-1 overflow-hidden'}>
            {pills}
          </div>
          {layout === 'map' ? secondary : showStateFilter ? secondary : null}
        </div>
        {showBuddySubtype ? (
          <ExploreBuddySubtypePillsRow
            subtype={buddySubtype}
            onSubtypeChange={onBuddySubtypeChange!}
            layout={layout}
          />
        ) : null}
        {showOutingTopic ? (
          <ExploreOutingTopicPillsRow
            topic={outingTopic}
            onTopicChange={onOutingTopicChange!}
            layout={layout}
          />
        ) : null}
        {activityModeRow}
        {pinKindRow}
      </div>

      {/* Mobile map — pills full width; calendar/state on row below, right-aligned */}
      {layout === 'map' ? (
        <div className="flex flex-col gap-1.5 lg:hidden">
          {pills}
          {pinKindRow}
          {showBuddySubtype ? (
            <ExploreBuddySubtypePillsRow
              subtype={buddySubtype}
              onSubtypeChange={onBuddySubtypeChange!}
              layout="map"
            />
          ) : null}
          {showOutingTopic ? (
            <ExploreOutingTopicPillsRow
              topic={outingTopic}
              onTopicChange={onOutingTopicChange!}
              layout="map"
            />
          ) : null}
          {activityModeRow}
          {secondary ? <div className="flex w-full justify-end">{secondary}</div> : null}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 lg:hidden">
          {listMobilePills}
          {showBuddySubtype ? (
            <ExploreBuddySubtypePillsRow
              subtype={buddySubtype}
              onSubtypeChange={onBuddySubtypeChange!}
              layout="list"
            />
          ) : null}
          {showOutingTopic ? (
            <ExploreOutingTopicPillsRow
              topic={outingTopic}
              onTopicChange={onOutingTopicChange!}
              layout="list"
            />
          ) : null}
          {activityModeRow}
        </div>
      )}
    </div>
  );
};
