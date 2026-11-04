import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import type { ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import { UiTooltip } from '../../components/ui/UiTooltip';
import {
  EXPLORE_MAP_MOBILE_FILTER_CTA_ALL_LABEL,
  EXPLORE_MAP_MOBILE_FILTER_CTA_ICON,
  EXPLORE_MAP_TOOLBAR_FLOATING,
  EXPLORE_MAP_TOOLBAR_PILL_PADDING,
  EXPLORE_MAP_TOOLBAR_SEGMENT_ICON,
  exploreMapLayerFilterBarClass,
  exploreMapLayerIconClass,
  exploreMapMobileFilterCtaSegmentClass,
} from '../../config/exploreTheme';
import { EXPLORE_PLACES_LAYER_EMOJI, SEEKING_EMOJI } from '../exploreCopy';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import {
  EXPLORE_MOBILE_ACTIVITY_MENU,
  EXPLORE_MOBILE_PLACES_MENU,
  browsePanelForMobileLayer,
  defaultMobileMapExpandedLayer,
  inferMobilePlacesMenuKey,
  mapFilterToMobileActivityMenu,
  mobileActivityMenuToMapFilter,
  mobilePlacesMenuToMapFilter,
  mobilePlacesMenuToVenueFilter,
  type ExploreMobileActivityMenuKey,
  type ExploreMobilePlacesMenuKey,
} from './exploreMapMobileMenus';
import { ExploreFilterIcon } from './ExploreFilterIcon';
import { ExploreMapMobileAnydayPill } from './ExploreMapMobileAnydayPill';
import { ExploreMapMobileUaePill } from './ExploreMapMobileUaePill';

const INTENT_SEGMENT_HIT = 'h-7 w-11 shrink-0';
const SEGMENT_DIVIDER = 'mx-0.5 h-5 w-px shrink-0 bg-neutral-300/60';
const FILTER_SLIDE =
  'flex h-full w-full min-w-0 items-stretch gap-1 transition-transform duration-300 ease-out motion-reduce:transition-none';

const PILL_ROW_WRAP = 'mt-0.5 w-full min-w-0 max-lg:w-full';

const ctaSegmentClass = (
  active: boolean,
  activeKey: 'all' | 'hiking' | 'camping' | 'rideshare' | 'others' | 'shops'
) => exploreMapMobileFilterCtaSegmentClass(active, activeKey);

const tip = (label: string, button: ReactElement, className?: string) => (
  <UiTooltip label={label} className={className}>
    {button}
  </UiTooltip>
);

type MobileLayer = 'activity' | 'places';

type ExploreMapMobileLayerChromeProps = {
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
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onSearchCommit?: (scope?: ExploreSearchScopeKey | null) => void;
  searchScopeCounts?: ExploreSearchScopeCounts;
  /** Open explore search modal (not list discover). */
  onOpenExploreSearch?: () => void;
};

export const ExploreMapMobileLayerChrome = ({
  panel,
  mapFilter,
  venueRegions,
  activityDatePreset,
  onBrowsePanelChange,
  onMapFilterChange,
  onActivityDatePresetChange,
  onVenueRegionsChange,
  venueFilter = 'all',
  onVenueFilterChange,
  onOpenExploreSearch,
}: ExploreMapMobileLayerChromeProps) => {
  const [expandedLayer, setExpandedLayer] = useState<MobileLayer | null>(() =>
    defaultMobileMapExpandedLayer(panel)
  );
  const intentBarRef = useRef<HTMLDivElement>(null);

  const onActivities = panel === 'activities';
  const onPlaces = panel === 'venues' || panel === 'shops';

  // List sheet / browse tabs change `panel` — keep the matching filter row open (do not collapse to null).
  useEffect(() => {
    setExpandedLayer(defaultMobileMapExpandedLayer(panel));
  }, [panel]);

  const activitySelection = mapFilterToMobileActivityMenu(mapFilter);
  const [placesMenuKey, setPlacesMenuKey] = useState<ExploreMobilePlacesMenuKey>(() =>
    inferMobilePlacesMenuKey(mapFilter, venueFilter)
  );

  useEffect(() => {
    setPlacesMenuKey((current) => inferMobilePlacesMenuKey(mapFilter, venueFilter, current));
  }, [mapFilter, venueFilter]);

  const applyPlacesVenueFilter = useCallback(
    (key: ExploreMobilePlacesMenuKey) => {
      const venue = mobilePlacesMenuToVenueFilter(key);
      if (venue && onVenueFilterChange) {
        onVenueFilterChange(venue);
        return;
      }
      const next = mobilePlacesMenuToMapFilter(key);
      if (next) onMapFilterChange(next);
    },
    [onMapFilterChange, onVenueFilterChange]
  );

  const openLayer = (layer: MobileLayer) => {
    onBrowsePanelChange(browsePanelForMobileLayer(layer));
    setExpandedLayer(layer);
  };

  const handleActivityPill = (key: ExploreMobileActivityMenuKey) => {
    if (key === 'anyday') return;
    onBrowsePanelChange('activities');
    const next = mobileActivityMenuToMapFilter(key);
    if (!next) return;
    if (key === 'all') {
      if (activityDatePreset !== 'anyday') {
        onActivityDatePresetChange('anyday');
        return;
      }
      if (mapFilter === 'all') {
        return;
      }
      onMapFilterChange('all');
      return;
    }
    if (onActivities && next === mapFilter) {
      onMapFilterChange('all');
      return;
    }
    onMapFilterChange(next);
  };

  const handlePlacesPill = (key: ExploreMobilePlacesMenuKey) => {
    if (key === 'uae') return;
    onBrowsePanelChange(key === 'shops' ? 'shops' : 'venues');
    if (key === 'all') {
      if (venueRegions.length > 0) {
        onVenueRegionsChange([]);
        return;
      }
      if (placesMenuKey === 'all' && mapFilter === 'all' && venueFilter === 'all') {
        return;
      }
      setPlacesMenuKey('all');
      applyPlacesVenueFilter('all');
      return;
    }
    if (onPlaces && key === placesMenuKey) {
      setPlacesMenuKey('all');
      applyPlacesVenueFilter('all');
      return;
    }
    setPlacesMenuKey(key);
    applyPlacesVenueFilter(key);
  };

  const activitySegmentSelected = expandedLayer === 'activity';
  const placesSegmentSelected = expandedLayer === 'places';

  const layerSwitcher = (layout: 'compact' | 'bar') => (
    <>
      {tip(
        'Events — outing filters',
        <button
          type="button"
          className={`${exploreMapLayerIconClass(activitySegmentSelected, 'activity', layout)} ${EXPLORE_MAP_TOOLBAR_SEGMENT_ICON}`}
          aria-label="Events — outing filters"
          aria-pressed={activitySegmentSelected}
          aria-expanded={expandedLayer === 'activity'}
          aria-controls="explore-map-layer-filters"
          onClick={() => openLayer('activity')}
        >
          <span className="font-emoji" aria-hidden>
            {SEEKING_EMOJI}
          </span>
        </button>
      )}
      {layout === 'compact' ? <span className={SEGMENT_DIVIDER} aria-hidden /> : null}
      {tip(
        'Places — trails and venues',
        <button
          type="button"
          className={`${exploreMapLayerIconClass(placesSegmentSelected, 'places', layout)} ${EXPLORE_MAP_TOOLBAR_SEGMENT_ICON}`}
          aria-label="Places — trail and venue filters"
          aria-pressed={placesSegmentSelected}
          aria-expanded={expandedLayer === 'places'}
          aria-controls="explore-map-layer-filters"
          onClick={() => openLayer('places')}
        >
          <span className="font-emoji" aria-hidden>
            {EXPLORE_PLACES_LAYER_EMOJI}
          </span>
        </button>
      )}
    </>
  );

  const activityPills = EXPLORE_MOBILE_ACTIVITY_MENU.map((option) => {
    const activeKey =
      option.key === 'camping'
        ? 'camping'
        : option.key === 'rideshare'
          ? 'rideshare'
          : option.key === 'others'
            ? 'others'
            : option.key === 'hiking'
              ? 'hiking'
              : 'all';
    if (option.key === 'anyday') {
      return (
        <ExploreMapMobileAnydayPill
          key={option.key}
          activityDatePreset={activityDatePreset}
          onActivityDatePresetChange={onActivityDatePresetChange}
          pillClassName={ctaSegmentClass(activityDatePreset !== 'anyday', 'all')}
          compact
        />
      );
    }
    const active =
      onActivities &&
      option.key === activitySelection &&
      (option.key !== 'all' || activityDatePreset === 'anyday');
    const button = (
      <button
        type="button"
        onClick={() => handleActivityPill(option.key)}
        className={ctaSegmentClass(active, activeKey)}
        aria-pressed={active}
        aria-label={option.label}
      >
        {option.key === 'all' ? (
          <span className={EXPLORE_MAP_MOBILE_FILTER_CTA_ALL_LABEL}>{option.label}</span>
        ) : (
          <ExploreFilterIcon
            filter={
              option.key === 'rideshare'
                ? 'rideshare'
                : option.key === 'others'
                  ? 'others'
                  : option.key === 'camping'
                    ? 'camping'
                    : 'hiking'
            }
            context="activity"
            className={EXPLORE_MAP_MOBILE_FILTER_CTA_ICON}
          />
        )}
      </button>
    );
    return (
      <span key={option.key} className="flex min-w-0 flex-1 basis-0">
        {option.key === 'all' ? button : tip(option.label, button, 'flex min-w-0 flex-1')}
      </span>
    );
  });

  const placesPills = EXPLORE_MOBILE_PLACES_MENU.map((option) => {
    if (option.key === 'uae') {
      return (
        <ExploreMapMobileUaePill
          key={option.key}
          venueRegions={venueRegions}
          onOpen={() => onBrowsePanelChange('venues')}
          onVenueRegionsChange={onVenueRegionsChange}
          pillClassName={ctaSegmentClass(venueRegions.length > 0, 'all')}
          compact
        />
      );
    }
    const active =
      onPlaces &&
      option.key === placesMenuKey &&
      (option.key !== 'all' || venueRegions.length === 0);
    const activeKey =
      option.key === 'shops'
        ? 'shops'
        : option.key === 'trails'
          ? 'hiking'
          : option.key === 'camping'
            ? 'camping'
            : option.key === 'spots'
              ? 'rideshare'
              : option.key === 'others'
                ? 'others'
                : 'all';
    const button = (
      <button
        type="button"
        onClick={() => handlePlacesPill(option.key)}
        className={ctaSegmentClass(active, activeKey)}
        aria-pressed={active}
        aria-label={option.label}
      >
        {option.key === 'all' ? (
          <span className={EXPLORE_MAP_MOBILE_FILTER_CTA_ALL_LABEL}>{option.label}</span>
        ) : (
          <ExploreFilterIcon
            filter={
              option.key === 'trails'
                ? 'trails'
                : option.key === 'spots'
                  ? 'spots'
                  : option.key === 'shops'
                    ? 'shops'
                    : option.key === 'camping'
                      ? 'camping'
                      : 'others'
            }
            context="venue"
            className={EXPLORE_MAP_MOBILE_FILTER_CTA_ICON}
          />
        )}
      </button>
    );
    return (
      <span key={option.key} className="flex min-w-0 flex-1 basis-0">
        {option.key === 'all' ? button : tip(option.label, button, 'flex min-w-0 flex-1')}
      </span>
    );
  });

  const slidingFilters = (
    <div
      id="explore-map-layer-filters"
      className="relative min-h-8 min-w-0 flex-1 self-stretch overflow-hidden"
    >
      <div
        className={`${FILTER_SLIDE} ${
          expandedLayer === 'activity'
            ? 'translate-x-0'
            : 'pointer-events-none -translate-x-full'
        }`}
        role="toolbar"
        aria-label="Event filters"
        aria-hidden={expandedLayer !== 'activity'}
      >
        {activityPills}
      </div>
      <div
        className={`absolute inset-0 ${FILTER_SLIDE} ${
          expandedLayer === 'places'
            ? 'translate-x-0'
            : 'pointer-events-none translate-x-full'
        }`}
        role="toolbar"
        aria-label="Place filters"
        aria-hidden={expandedLayer !== 'places'}
      >
        {placesPills}
      </div>
    </div>
  );

  return (
    <>
      <div
        ref={intentBarRef}
        className={`${EXPLORE_MAP_TOOLBAR_FLOATING} ${EXPLORE_MAP_TOOLBAR_PILL_PADDING} col-start-1 row-start-1 inline-flex w-fit shrink-0 items-center self-start overflow-visible pl-2 pr-2.5 md:hidden`}
      >
        {layerSwitcher('compact')}
        <span className={SEGMENT_DIVIDER} aria-hidden />
        {onOpenExploreSearch ? (
          tip(
            'Search',
            <button
              type="button"
              className={`${exploreMapLayerIconClass(false, 'activity')} ${EXPLORE_MAP_TOOLBAR_SEGMENT_ICON}`}
              aria-label="Search explore"
              onClick={() => onOpenExploreSearch()}
            >
              <span className="font-emoji" aria-hidden>
                🔍
              </span>
            </button>
          )
        ) : (
          <span className={`inline-flex ${INTENT_SEGMENT_HIT} items-center justify-center text-lg opacity-40`} aria-hidden>
            <span className="font-emoji" aria-hidden>
              🔍
            </span>
          </span>
        )}
      </div>

      <div className={`${PILL_ROW_WRAP} col-span-2 col-start-1 row-start-2 md:row-start-1 lg:w-auto lg:max-w-[46rem]`}>
        <div
          className={`${exploreMapLayerFilterBarClass(
            expandedLayer === 'places' ? 'places' : 'activity'
          )} transition-colors duration-300 motion-reduce:transition-none`}
        >
          <span className="hidden shrink-0 items-stretch gap-1 self-stretch md:inline-flex">
            {layerSwitcher('bar')}
            <span className={`${SEGMENT_DIVIDER} self-center`} aria-hidden />
          </span>
          {slidingFilters}
        </div>
      </div>
    </>
  );
};
