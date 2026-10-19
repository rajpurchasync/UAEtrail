import { useEffect, useRef, useState } from 'react';
import {
  SEEKING_EMOJI,
  EXPLORE_PLACES_LAYER_EMOJI,
  MAP_LAYER_FILTER_EMOJI,
  RIDESHARE_EMOJI,
} from '../exploreCopy';
import type { ExplorePanel, MapFilterKey } from '../routing';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import {
  EXPLORE_FILTER_PILL,
  EXPLORE_MAP_FILTER_INACTIVE,
  EXPLORE_MAP_TOOLBAR_FLOATING,
  EXPLORE_MAP_TOOLBAR_PILL_PADDING,
  exploreMapFilterActiveClass,
} from '../../config/exploreTheme';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import {
  EXPLORE_MOBILE_ACTIVITY_MENU,
  EXPLORE_MOBILE_PLACES_MENU,
  browsePanelForMobileLayer,
  defaultMobileMapExpandedLayer,
  mapFilterToMobileActivityMenu,
  mapFilterToMobilePlacesMenu,
  mobileActivityMenuToMapFilter,
  mobilePlacesMenuToMapFilter,
  type ExploreMobileActivityMenuKey,
  type ExploreMobilePlacesMenuKey,
} from './exploreMapMobileMenus';
import { ExploreFilterIcon } from './ExploreFilterIcon';
import { ExploreMapMobileAnydayPill } from './ExploreMapMobileAnydayPill';
import { ExploreMapMobileUaePill } from './ExploreMapMobileUaePill';

const INTENT_SEGMENT_HIT = 'h-7 w-11 shrink-0';
const SEGMENT_DIVIDER = 'mx-0.5 h-5 w-px shrink-0 bg-neutral-300/60';

const segmentButtonClass = (selected: boolean) =>
  `relative inline-flex ${INTENT_SEGMENT_HIT} items-center justify-center text-lg leading-none transition [-webkit-tap-highlight-color:transparent] ${
    selected
      ? "after:pointer-events-none after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:rounded-full after:bg-emerald-600 after:content-['']"
      : ''
  }`;

const PILL_ROW_SCROLL =
  'mt-0.5 w-full min-w-0 max-lg:-mr-3 max-lg:w-[calc(100%+0.75rem)] overflow-x-auto overflow-y-visible scroll-smooth scrollbar-none [-webkit-overflow-scrolling:touch]';

const PILL_ROW_INNER = 'flex w-max flex-nowrap items-center gap-2 pb-0.5 pr-3';

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
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onSearchCommit?: (scope?: ExploreSearchScopeKey | null) => void;
  searchScopeCounts?: ExploreSearchScopeCounts;
  /** Open explore search modal (not list discover). */
  onOpenExploreSearch?: () => void;
};

const pillClass = (active: boolean, activeKey: 'all' | 'hiking' | 'camping' | 'rideshare' | 'others' | 'shops') =>
  `${EXPLORE_FILTER_PILL.mapTopic} ${active ? exploreMapFilterActiveClass(activeKey) : EXPLORE_MAP_FILTER_INACTIVE}`;

export const ExploreMapMobileLayerChrome = ({
  panel,
  mapFilter,
  venueRegions,
  activityDatePreset,
  onBrowsePanelChange,
  onMapFilterChange,
  onActivityDatePresetChange,
  onVenueRegionsChange,
  onOpenExploreSearch,
}: ExploreMapMobileLayerChromeProps) => {
  const [expandedLayer, setExpandedLayer] = useState<MobileLayer | null>(() =>
    defaultMobileMapExpandedLayer(panel)
  );
  const intentBarRef = useRef<HTMLDivElement>(null);

  const onActivities = panel === 'activities';
  const onPlaces = panel === 'venues' || panel === 'shops';

  // List sheet / desktop tabs change `panel` — keep map chrome on the same browse mode (not a second layer).
  useEffect(() => {
    setExpandedLayer((current) => {
      if (panel === 'activities' && current === 'places') return null;
      if ((panel === 'venues' || panel === 'shops') && current === 'activity') return null;
      return current;
    });
  }, [panel]);

  const activitySelection = mapFilterToMobileActivityMenu(mapFilter);
  const placesSelection = mapFilterToMobilePlacesMenu(mapFilter);

  const openLayer = (layer: MobileLayer) => {
    onBrowsePanelChange(browsePanelForMobileLayer(layer));
    setExpandedLayer((current) => (current === layer ? null : layer));
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
        setExpandedLayer(null);
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
    const next = mobilePlacesMenuToMapFilter(key);
    if (!next) return;
    if (key === 'all') {
      if (venueRegions.length > 0) {
        onVenueRegionsChange([]);
        return;
      }
      if (mapFilter === 'all') {
        setExpandedLayer(null);
        return;
      }
      onMapFilterChange('all');
      return;
    }
    if (onPlaces && next === mapFilter) {
      onMapFilterChange('all');
      return;
    }
    onMapFilterChange(next);
  };

  const activitySegmentSelected = expandedLayer === 'activity';
  const placesSegmentSelected = expandedLayer === 'places';

  return (
    <>
      <div
        ref={intentBarRef}
        className={`${EXPLORE_MAP_TOOLBAR_FLOATING} ${EXPLORE_MAP_TOOLBAR_PILL_PADDING} col-start-1 row-start-1 inline-flex shrink-0 items-center overflow-visible pl-2 pr-2.5 lg:hidden`}
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
            onClick={() => {
              setExpandedLayer(null);
              onOpenExploreSearch();
            }}
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
        <div className={`${PILL_ROW_SCROLL} col-span-2 col-start-1 row-start-2 lg:hidden`}>
          <div className={PILL_ROW_INNER}>
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
                    pillClassName={pillClass(activityDatePreset !== 'anyday', 'all')}
                  />
                );
              }
              const active = onActivities && option.key === activitySelection;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleActivityPill(option.key)}
                  className={pillClass(active, activeKey)}
                  aria-pressed={active}
                >
                  {option.key === 'hiking' ? (
                    <ExploreFilterIcon filter="hiking" context="activity" />
                  ) : option.key === 'camping' ? (
                    <ExploreFilterIcon filter="camping" context="activity" />
                  ) : option.key === 'rideshare' ? (
                    <span className="font-emoji text-base leading-none" aria-hidden>{RIDESHARE_EMOJI}</span>
                  ) : option.key === 'others' ? (
                    <span className="font-emoji text-base leading-none" aria-hidden>
                      {MAP_LAYER_FILTER_EMOJI.others}
                    </span>
                  ) : null}
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {expandedLayer === 'places' ? (
        <div className={`${PILL_ROW_SCROLL} col-span-2 col-start-1 row-start-2 lg:hidden`}>
          <div className={PILL_ROW_INNER}>
            {EXPLORE_MOBILE_PLACES_MENU.map((option) => {
              if (option.key === 'uae') {
                return (
                  <ExploreMapMobileUaePill
                    key={option.key}
                    venueRegions={venueRegions}
                    onOpen={() => onBrowsePanelChange('venues')}
                    onVenueRegionsChange={onVenueRegionsChange}
                    pillClassName={pillClass(venueRegions.length > 0, 'all')}
                  />
                );
              }
              const active = onPlaces && option.key === placesSelection;
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
                  className={pillClass(active, activeKey)}
                  aria-pressed={active}
                >
                  {option.key === 'trails' ? (
                    <ExploreFilterIcon filter="hiking" context="venue" />
                  ) : option.key === 'spots' || option.key === 'camping' ? (
                    <ExploreFilterIcon filter="camping" context="venue" />
                  ) : option.key === 'shops' ? (
                    <ExploreFilterIcon filter="shops" context="venue" />
                  ) : null}
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
};
