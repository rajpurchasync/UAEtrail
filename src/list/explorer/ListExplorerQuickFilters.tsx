import type { ExploreActivityDatePreset } from '../../explore/exploreActivityDateFilter';
import {
  EXPLORE_MAP_MOBILE_FLOAT_CHIP_MARK,
  exploreMapMobileFloatChipClass,
} from '../../config/exploreTheme';
import type { MapFilterKey } from '../../config/routingCatalog';
import {
  EXPLORE_MOBILE_ACTIVITY_QUICK_FILTERS,
  EXPLORE_MOBILE_PLACES_QUICK_FILTERS,
  type ExploreMobileActivityMenuKey,
  type ExploreMobilePlacesMenuKey,
} from '../../explore/ui/exploreMapMobileMenus';
import { ExploreFilterIcon } from '../../explore/ui/ExploreFilterIcon';
import { ExploreMapMobileAnydayPill } from '../../explore/ui/ExploreMapMobileAnydayPill';
import { ExploreMapMobileUaePill } from '../../explore/ui/ExploreMapMobileUaePill';
import type { BrowseListFilterState } from '../browseListFilters';
import {
  browseTripTopicIsActive,
  type BrowseTripTopicKey,
} from '../browseListTripTopics';
import type { ListVenuePlaceTopicKey } from '../listVenuePlaceTopics';
import type { ListExplorerBucket } from './listExplorerBucket';

const FLOAT_CHIP_WRAP = 'relative flex shrink-0 items-center justify-center';

const activityChipFilter = (key: ExploreMobileActivityMenuKey): MapFilterKey => {
  if (key === 'hiking' || key === 'camping' || key === 'rideshare' || key === 'others') return key;
  return 'all';
};

const placesChipFilter = (key: ExploreMobilePlacesMenuKey): MapFilterKey => {
  if (key === 'hiking' || key === 'camping' || key === 'facilities' || key === 'shops' || key === 'others') {
    return key;
  }
  return 'all';
};

const activityQuickFilterLabels: Record<ExploreMobileActivityMenuKey, string> = {
  all: 'All',
  anyday: 'Anyday',
  hiking: 'Hiking',
  camping: 'Camping',
  rideshare: 'Rideshare',
  others: 'Other',
};

const placesQuickFilterLabels: Record<ExploreMobilePlacesMenuKey, string> = {
  all: 'All',
  uae: 'UAE',
  hiking: 'Trail',
  camping: 'Camping',
  facilities: 'Facilities',
  shops: 'Shopping',
  others: 'Other',
};

const listVenueKeyForPlacesMenu = (key: ExploreMobilePlacesMenuKey): ListVenuePlaceTopicKey | null => {
  if (key === 'hiking' || key === 'camping' || key === 'facilities' || key === 'others') return key;
  if (key === 'shops') return 'shop';
  return null;
};

const isActivityTripTopicKey = (key: ExploreMobileActivityMenuKey): key is BrowseTripTopicKey =>
  key === 'hiking' || key === 'camping' || key === 'rideshare' || key === 'others';

type ListExplorerQuickFiltersProps = {
  bucket: ListExplorerBucket;
  filters: BrowseListFilterState;
  regions: string[];
  onToggleTripTopic: (key: BrowseTripTopicKey) => void;
  onTogglePlaceTopic: (key: ListVenuePlaceTopicKey) => void;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  onVenueRegionsChange: (regions: string[]) => void;
};

export const ListExplorerQuickFilters = ({
  bucket,
  filters,
  regions,
  onToggleTripTopic,
  onTogglePlaceTopic,
  onActivityDatePresetChange,
  onVenueRegionsChange,
}: ListExplorerQuickFiltersProps) => {
  const onTrips = bucket === 'events';
  const trailingPillClass = (active: boolean, filterKey: MapFilterKey, pillLayer: 'activity' | 'places') =>
    exploreMapMobileFloatChipClass(active, filterKey, pillLayer);

  const calendarPill = (
    <ExploreMapMobileAnydayPill
      activityDatePreset={filters.activityDatePreset}
      onActivityDatePresetChange={onActivityDatePresetChange}
      pillClassName={trailingPillClass(filters.activityDatePreset !== 'anyday', 'all', 'activity')}
      wrapClassName={FLOAT_CHIP_WRAP}
      triggerFullWidth={false}
      compact={false}
    />
  );

  const uaePill = (
    <ExploreMapMobileUaePill
      venueRegions={regions}
      onVenueRegionsChange={onVenueRegionsChange}
      pillClassName={trailingPillClass(regions.length > 0, 'all', 'places')}
      wrapClassName={FLOAT_CHIP_WRAP}
      triggerFullWidth={false}
      compact={false}
    />
  );

  const activityChips = EXPLORE_MOBILE_ACTIVITY_QUICK_FILTERS.map((key) => {
    const filterKey = activityChipFilter(key);
    const label = activityQuickFilterLabels[key];
    const active = onTrips && isActivityTripTopicKey(key) && browseTripTopicIsActive(filters.tripTopics, key);
    return (
      <span key={key} className={FLOAT_CHIP_WRAP}>
        <button
          type="button"
          onClick={() => {
            if (isActivityTripTopicKey(key)) onToggleTripTopic(key);
          }}
          className={exploreMapMobileFloatChipClass(active, filterKey, 'activity')}
          aria-pressed={active}
          aria-label={label}
        >
          <ExploreFilterIcon
            filter={filterKey}
            context="activity"
            markClassName={EXPLORE_MAP_MOBILE_FLOAT_CHIP_MARK}
          />
          <span>{label}</span>
        </button>
      </span>
    );
  });

  const placesChips = EXPLORE_MOBILE_PLACES_QUICK_FILTERS.map((key) => {
    const filterKey = placesChipFilter(key);
    const label = placesQuickFilterLabels[key];
    const venueKey = listVenueKeyForPlacesMenu(key);
    const active = !onTrips && venueKey != null && filters.placeTopics.includes(venueKey);
    const iconFilter =
      key === 'facilities'
        ? 'facilities'
        : key === 'shops'
          ? 'shops'
          : key === 'camping'
            ? 'camping'
            : 'trails';
    return (
      <span key={key} className={FLOAT_CHIP_WRAP}>
        <button
          type="button"
          onClick={() => {
            if (venueKey) onTogglePlaceTopic(venueKey);
          }}
          className={exploreMapMobileFloatChipClass(active, filterKey, 'places')}
          aria-pressed={active}
          aria-label={label}
        >
          <ExploreFilterIcon
            filter={iconFilter}
            context="venue"
            markClassName={EXPLORE_MAP_MOBILE_FLOAT_CHIP_MARK}
          />
          <span>{label}</span>
        </button>
      </span>
    );
  });

  return (
    <div
      className="mt-3 flex w-full min-w-0 items-center gap-2 overflow-x-auto scrollbar-none py-0.5"
      role="toolbar"
      aria-label={onTrips ? 'Trip filters' : 'Venue filters'}
    >
      {onTrips ? (
        <>
          {calendarPill}
          {activityChips}
        </>
      ) : (
        <>
          {uaePill}
          {placesChips}
        </>
      )}
    </div>
  );
};
