import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SEEKING_EMOJI,
  EXPLORE_PLACES_LAYER_EMOJI,
  MAP_LAYER_FILTER_EMOJI,
  RIDESHARE_EMOJI,
} from '../exploreCopy';
import type { ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import {
  EXPLORE_MAP_MOBILE_FILTER_CTA_ALL_LABEL,
  EXPLORE_MAP_MOBILE_FILTER_CTA_BAR,
  EXPLORE_MAP_MOBILE_FILTER_CTA_ICON,
  EXPLORE_MAP_TOOLBAR_FLOATING,
  EXPLORE_MAP_TOOLBAR_PILL_PADDING,
  EXPLORE_MAP_TOOLBAR_SEGMENT_ICON,
  exploreMapMobileFilterCtaSegmentClass,
} from '../../config/exploreTheme';
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

const segmentButtonClass = (selected: boolean) =>
  `relative inline-flex ${INTENT_SEGMENT_HIT} items-center justify-center ${EXPLORE_MAP_TOOLBAR_SEGMENT_ICON} transition [-webkit-tap-highlight-color:transparent] ${
    selected
      ? "after:pointer-events-none after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:rounded-full after:bg-emerald-600 after:content-['']"
      : ''
  }`;

const PILL_ROW_WRAP = 'mt-0.5 w-full min-w-0 max-lg:w-full';

const ctaSegmentClass = (
  active: boolean,
  activeKey: 'all' | 'hiking' | 'camping' | 'rideshare' | 'others' | 'shops'
) => exploreMapMobileFilterCtaSegmentClass(active, activeKey);

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

  return (
    <>
      <div
        ref={intentBarRef}
        className={`${EXPLORE_MAP_TOOLBAR_FLOATING} ${EXPLORE_MAP_TOOLBAR_PILL_PADDING} col-start-1 row-start-1 inline-flex w-fit shrink-0 items-center self-start overflow-visible pl-2 pr-2.5`}
      >
        <button
          type="button"
          className={segmentButtonClass(activitySegmentSelected)}
          aria-label="Activities — same filters as the list"
          aria-expanded={expandedLayer === 'activity'}
          onClick={() => openLayer('activity')}
        >
          <span className="font-emoji" aria-hidden>{SEEKING_EMOJI}</span>
        </button>
        <span className={SEGMENT_DIVIDER} aria-hidden />
        <button
          type="button"
          className={segmentButtonClass(placesSegmentSelected)}
          aria-label="Places — same filters as the list"
          aria-expanded={expandedLayer === 'places'}
          onClick={() => openLayer('places')}
        >
          <span className="font-emoji" aria-hidden>{EXPLORE_PLACES_LAYER_EMOJI}</span>
        </button>
        <span className={SEGMENT_DIVIDER} aria-hidden />
        {onOpenExploreSearch ? (
          <button
            type="button"
            className={segmentButtonClass(false)}
            aria-label="Search explore"
            onClick={() => onOpenExploreSearch()}
          >
            <span className="font-emoji" aria-hidden>🔍</span>
          </button>
        ) : (
          <span className={`inline-flex ${INTENT_SEGMENT_HIT} items-center justify-center text-lg opacity-40`} aria-hidden>
            🔍
          </span>
        )}
      </div>

      {expandedLayer === 'activity' ? (
        <div className={`${PILL_ROW_WRAP} col-span-2 col-start-1 row-start-2 lg:w-[36rem] lg:max-w-full`}>
          <div className={EXPLORE_MAP_MOBILE_FILTER_CTA_BAR} role="toolbar" aria-label="Activity filters">
            {EXPLORE_MOBILE_ACTIVITY_MENU.map((option) => {
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
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleActivityPill(option.key)}
                  className={ctaSegmentClass(active, activeKey)}
                  aria-pressed={active}
                  aria-label={option.label}
                >
                  {option.key === 'all' ? (
                    <span className={EXPLORE_MAP_MOBILE_FILTER_CTA_ALL_LABEL}>{option.label}</span>
                  ) : option.key === 'hiking' ? (
                    <ExploreFilterIcon filter="hiking" context="activity" className={EXPLORE_MAP_MOBILE_FILTER_CTA_ICON} />
                  ) : option.key === 'camping' ? (
                    <ExploreFilterIcon filter="camping" context="activity" className={EXPLORE_MAP_MOBILE_FILTER_CTA_ICON} />
                  ) : option.key === 'rideshare' ? (
                    <span className={`font-emoji ${EXPLORE_MAP_MOBILE_FILTER_CTA_ICON}`} aria-hidden>{RIDESHARE_EMOJI}</span>
                  ) : option.key === 'others' ? (
                    <span className={`font-emoji ${EXPLORE_MAP_MOBILE_FILTER_CTA_ICON}`} aria-hidden>
                      {MAP_LAYER_FILTER_EMOJI.others}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {expandedLayer === 'places' ? (
        <div className={`${PILL_ROW_WRAP} col-span-2 col-start-1 row-start-2 lg:w-[36rem] lg:max-w-full`}>
          <div className={EXPLORE_MAP_MOBILE_FILTER_CTA_BAR} role="toolbar" aria-label="Place filters">
            {EXPLORE_MOBILE_PLACES_MENU.map((option) => {
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
                    : option.key === 'spots' || option.key === 'camping'
                      ? 'camping'
                      : option.key === 'others'
                        ? 'others'
                        : 'all';
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handlePlacesPill(option.key)}
                  className={ctaSegmentClass(active, activeKey)}
                  aria-pressed={active}
                  aria-label={option.label}
                >
                  {option.key === 'all' ? (
                    <span className={EXPLORE_MAP_MOBILE_FILTER_CTA_ALL_LABEL}>{option.label}</span>
                  ) : option.key === 'trails' ? (
                    <ExploreFilterIcon filter="hiking" context="venue" className={EXPLORE_MAP_MOBILE_FILTER_CTA_ICON} />
                  ) : option.key === 'spots' || option.key === 'camping' ? (
                    <ExploreFilterIcon filter="camping" context="venue" className={EXPLORE_MAP_MOBILE_FILTER_CTA_ICON} />
                  ) : option.key === 'shops' ? (
                    <ExploreFilterIcon filter="shops" context="venue" className={EXPLORE_MAP_MOBILE_FILTER_CTA_ICON} />
                  ) : option.key === 'others' ? (
                    <ExploreFilterIcon filter="others" context="venue" className={EXPLORE_MAP_MOBILE_FILTER_CTA_ICON} />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
};
