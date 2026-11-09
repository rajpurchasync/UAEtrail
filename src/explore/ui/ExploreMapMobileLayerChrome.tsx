import type { ReactElement } from 'react';
import type { ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import { UiTooltip } from '../../components/ui/UiTooltip';
import {
  EXPLORE_MAP_CHROME_FROST,
  EXPLORE_MAP_MOBILE_FLOAT_CHIP_MARK,
  exploreMapMobileFloatChipClass,
  exploreMapScopeSegmentClass,
} from '../../config/exploreTheme';
import { EXPLORE_PLACES_LAYER_EMOJI, SEEKING_EMOJI } from '../exploreCopy';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import {
  effectivePlaceMapTopics,
  effectiveTripMapTopics,
  type PlaceMapTopicKey,
  type TripMapTopicKey,
} from '../exploreMapQuickTopicFilters';
import {
  EXPLORE_MOBILE_ACTIVITY_QUICK_FILTERS,
  EXPLORE_MOBILE_PLACES_QUICK_FILTERS,
  browsePanelForMobileLayer,
  type ExploreMobileActivityMenuKey,
  type ExploreMobilePlacesMenuKey,
} from './exploreMapMobileMenus';
import { ExploreFilterIcon } from './ExploreFilterIcon';
import { ExploreMapMobileAnydayPill } from './ExploreMapMobileAnydayPill';
import { ExploreMapMobileUaePill } from './ExploreMapMobileUaePill';

const FLOAT_CHIP_WRAP = 'relative flex shrink-0 items-center justify-center';

const tip = (label: string, button: ReactElement) => (
  <UiTooltip label={label} className="flex h-full w-full items-stretch justify-center">
    {button}
  </UiTooltip>
);

type MobileLayer = 'activity' | 'places';

type ExploreMapMobileLayerChromeProps = {
  panel: ExplorePanel;
  mapFilter: MapFilterKey;
  venueRegions: string[];
  activityDatePreset: ExploreActivityDatePreset;
  tripMapTopics?: TripMapTopicKey[];
  placeMapTopics?: PlaceMapTopicKey[];
  onBrowsePanelChange: (panel: ExplorePanel) => void;
  onMapFilterChange: (filter: MapFilterKey) => void;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  onVenueRegionsChange: (regions: string[]) => void;
  onToggleTripMapTopic?: (key: TripMapTopicKey) => void;
  onTogglePlaceMapTopic?: (key: PlaceMapTopicKey) => void;
  venueFilter?: VenueListFilterKey;
  onVenueFilterChange?: (filter: VenueListFilterKey) => void;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onSearchCommit?: (scope?: ExploreSearchScopeKey | null) => void;
  searchScopeCounts?: ExploreSearchScopeCounts;
  /** Open explore search modal (not list discover). */
  onOpenExploreSearch?: () => void;
};

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

const isTripTopicKey = (key: ExploreMobileActivityMenuKey): key is TripMapTopicKey =>
  key === 'hiking' || key === 'camping' || key === 'rideshare' || key === 'others';

const isPlaceTopicKey = (key: ExploreMobilePlacesMenuKey): key is PlaceMapTopicKey =>
  key === 'hiking' || key === 'camping' || key === 'facilities' || key === 'shops';

export const ExploreMapMobileLayerChrome = ({
  panel,
  mapFilter,
  venueRegions,
  activityDatePreset,
  tripMapTopics = [],
  placeMapTopics = [],
  onBrowsePanelChange,
  onMapFilterChange,
  onActivityDatePresetChange,
  onVenueRegionsChange,
  onToggleTripMapTopic,
  onTogglePlaceMapTopic,
  venueFilter = 'all',
  onOpenExploreSearch,
}: ExploreMapMobileLayerChromeProps) => {
  const onActivities = panel === 'activities';
  const onPlaces = panel === 'venues' || panel === 'shops';
  const layer: MobileLayer = onPlaces ? 'places' : 'activity';

  const activeTripTopics = effectiveTripMapTopics(mapFilter, tripMapTopics);
  const activePlaceTopics = effectivePlaceMapTopics(mapFilter, venueFilter, placeMapTopics);

  const openLayer = (next: MobileLayer) => {
    onBrowsePanelChange(browsePanelForMobileLayer(next));
    if (next === 'places' && mapFilter === 'rideshare') onMapFilterChange('all');
    if (next === 'activity' && (mapFilter === 'shops' || mapFilter === 'facilities')) {
      onMapFilterChange('all');
    }
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

  const activityChips = EXPLORE_MOBILE_ACTIVITY_QUICK_FILTERS.map((key) => {
    const filterKey = activityChipFilter(key);
    const label = activityQuickFilterLabels[key];
    const active = onActivities && isTripTopicKey(key) && activeTripTopics.includes(key);
    const button = (
      <button
        type="button"
        onClick={() => {
          onBrowsePanelChange('activities');
          onToggleTripMapTopic?.(key as TripMapTopicKey);
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
    );
    return (
      <span key={key} className={FLOAT_CHIP_WRAP}>
        {tip(label, button)}
      </span>
    );
  });

  const placesChips = EXPLORE_MOBILE_PLACES_QUICK_FILTERS.map((key) => {
    const filterKey = placesChipFilter(key);
    const label = placesQuickFilterLabels[key];
    const active = onPlaces && isPlaceTopicKey(key) && activePlaceTopics.includes(key);
    const iconFilter =
      key === 'facilities'
        ? 'facilities'
        : key === 'shops'
          ? 'shops'
          : key === 'camping'
            ? 'camping'
            : 'trails';
    const button = (
      <button
        type="button"
        onClick={() => {
          onBrowsePanelChange(key === 'shops' ? 'shops' : 'venues');
          if (isPlaceTopicKey(key)) onTogglePlaceMapTopic?.(key);
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
    );
    return (
      <span key={key} className={FLOAT_CHIP_WRAP}>
        {tip(label, button)}
      </span>
    );
  });

  const trailingPillClass = (active: boolean, filterKey: MapFilterKey, pillLayer: 'activity' | 'places') =>
    exploreMapMobileFloatChipClass(active, filterKey, pillLayer);

  const calendarPill = (
    <ExploreMapMobileAnydayPill
      activityDatePreset={activityDatePreset}
      onActivityDatePresetChange={onActivityDatePresetChange}
      pillClassName={trailingPillClass(activityDatePreset !== 'anyday', 'all', 'activity')}
      wrapClassName={FLOAT_CHIP_WRAP}
      triggerFullWidth={false}
      compact={false}
    />
  );

  const uaePill = (
    <ExploreMapMobileUaePill
      venueRegions={venueRegions}
      onOpen={() => onBrowsePanelChange('venues')}
      onVenueRegionsChange={onVenueRegionsChange}
      pillClassName={trailingPillClass(venueRegions.length > 0, 'all', 'places')}
      wrapClassName={FLOAT_CHIP_WRAP}
      triggerFullWidth={false}
      compact={false}
    />
  );

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch">
      <div className="flex flex-col gap-0 overflow-visible">
      <div className="flex h-9 w-full min-w-0 items-center justify-between gap-2 px-0.5">
        <div
          className={`inline-flex h-9 w-[min(100%,12.75rem)] shrink-0 items-center gap-0.5 rounded-full p-0.5 ring-1 ring-black/5 ${EXPLORE_MAP_CHROME_FROST}`}
          role="tablist"
          aria-label="Map layer"
        >
          <button
            type="button"
            role="tab"
            className={`${exploreMapScopeSegmentClass(layer === 'activity', 'activity')} h-full min-w-0 flex-1 !justify-center !gap-1 !px-1.5 !py-0 !text-[11px]`}
            aria-selected={layer === 'activity'}
            onClick={() => openLayer('activity')}
          >
            <span className="font-emoji shrink-0 text-[0.9375rem] leading-none" aria-hidden>
              {SEEKING_EMOJI}
            </span>
            <span className="shrink-0 whitespace-nowrap">Trips</span>
          </button>
          <button
            type="button"
            role="tab"
            className={`${exploreMapScopeSegmentClass(layer === 'places', 'places')} h-full min-w-0 flex-1 !justify-center !gap-1 !px-1.5 !py-0 !text-[11px]`}
            aria-selected={layer === 'places'}
            onClick={() => openLayer('places')}
          >
            <span className="font-emoji shrink-0 text-[0.9375rem] leading-none" aria-hidden>
              {EXPLORE_PLACES_LAYER_EMOJI}
            </span>
            <span className="shrink-0 whitespace-nowrap">Venues</span>
          </button>
        </div>
        {onOpenExploreSearch ? (
          <UiTooltip label="Search" className="flex shrink-0 md:hidden">
            <button
              type="button"
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ring-black/5 ${EXPLORE_MAP_CHROME_FROST}`}
              aria-label="Search explore"
              onClick={() => onOpenExploreSearch()}
            >
              <span className="font-emoji" aria-hidden>
                🔍
              </span>
            </button>
          </UiTooltip>
        ) : null}
      </div>

      <div
        key={layer}
        className="explore-map-filter-quote-swap mt-1.5 max-lg:mt-3.5 flex w-full min-w-0 items-center gap-2 overflow-x-auto scrollbar-none py-0.5"
        role="toolbar"
        aria-label={layer === 'places' ? 'Venue filters' : 'Trip filters'}
      >
        {layer === 'places' ? (
          <>
            {uaePill}
            {placesChips}
          </>
        ) : (
          <>
            {calendarPill}
            {activityChips}
          </>
        )}
      </div>
      </div>
    </div>
  );
};
