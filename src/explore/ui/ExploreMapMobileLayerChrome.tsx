import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import { UiTooltip } from '../../components/ui/UiTooltip';
import {
  EXPLORE_MAP_CHROME_FROST,
  EXPLORE_MAP_FROST_TRAY,
  exploreMapChildChipClass,
  exploreMapScopeSegmentClass,
  EXPLORE_MAP_FILTER_ALL_CHIP_CLASS,
} from '../../config/exploreTheme';
import { EXPLORE_PLACES_LAYER_EMOJI, SEEKING_EMOJI } from '../exploreCopy';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import {
  EXPLORE_MOBILE_ACTIVITY_MENU,
  EXPLORE_MOBILE_PLACES_MENU,
  browsePanelForMobileLayer,
  inferMobilePlacesMenuKey,
  mapFilterToMobileActivityMenu,
  mobileActivityMenuToMapFilter,
  mobilePlacesMenuToMapFilter,
  mobilePlacesMenuToVenueFilter,
  type ExploreMobileActivityMenuKey,
  type ExploreMobilePlacesMenuKey,
} from './exploreMapMobileMenus';
import { useMinWidthLg } from '../../hooks/useMinWidthLg';
import { ExploreFilterIcon } from './ExploreFilterIcon';
import { ExploreMapMobileAnydayPill } from './ExploreMapMobileAnydayPill';
import { ExploreMapMobileUaePill } from './ExploreMapMobileUaePill';

const CHIP_WRAP =
  'relative flex min-w-0 shrink-0 items-stretch justify-center max-lg:flex-1';
const TRAY_SEP =
  'explore-map-filter-tray-sep mx-1.5 my-1 w-px min-w-[1px] shrink-0 self-stretch bg-neutral-500/55';

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
  /** Mobile — Find crew sits in the Events/Places row so the filter tray can go full width. */
  trailing?: ReactNode;
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
  trailing,
}: ExploreMapMobileLayerChromeProps) => {
  const isLg = useMinWidthLg();
  const activityTabRef = useRef<HTMLButtonElement>(null);
  const placesTabRef = useRef<HTMLButtonElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const [quoteCaret, setQuoteCaret] = useState({ left: 28, top: -8 });
  const onActivities = panel === 'activities';
  const onPlaces = panel === 'venues' || panel === 'shops';
  const layer: MobileLayer = onPlaces ? 'places' : 'activity';

  const activitySelection = mapFilterToMobileActivityMenu(mapFilter);
  const [placesMenuKey, setPlacesMenuKey] = useState<ExploreMobilePlacesMenuKey>(() =>
    inferMobilePlacesMenuKey(mapFilter, venueFilter)
  );

  useEffect(() => {
    setPlacesMenuKey(inferMobilePlacesMenuKey(mapFilter, venueFilter));
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

  const openLayer = (next: MobileLayer) => {
    onBrowsePanelChange(browsePanelForMobileLayer(next));
    if (next === 'places' && mapFilter === 'rideshare') onMapFilterChange('all');
    if (next === 'activity' && (mapFilter === 'shops' || mapFilter === 'facilities')) {
      onMapFilterChange('all');
    }
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
      if (mapFilter === 'all') return;
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
      if (placesMenuKey === 'all' && mapFilter === 'all' && venueFilter === 'all') return;
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

  const activityChips = EXPLORE_MOBILE_ACTIVITY_MENU.filter((option) => option.key !== 'anyday').map((option) => {
    const filterKey = activityChipFilter(option.key);
    const active =
      onActivities &&
      option.key === activitySelection &&
      (option.key !== 'all' || activityDatePreset === 'anyday');
    const button = (
      <button
        type="button"
        onClick={() => handleActivityPill(option.key)}
        className={`${exploreMapChildChipClass(active, filterKey, 'activity')}${option.key === 'all' ? ` ${EXPLORE_MAP_FILTER_ALL_CHIP_CLASS}` : ''}`}
        aria-pressed={active}
        aria-label={option.label}
      >
        {option.key !== 'all' ? (
          <ExploreFilterIcon
            filter={filterKey === 'all' ? 'hiking' : filterKey}
            context="activity"
          />
        ) : (
          <span className="explore-filter-mark explore-filter-mark--label" aria-hidden>
            All
          </span>
        )}
        {option.key !== 'all' ? <span className="max-lg:hidden">{option.label}</span> : null}
      </button>
    );
    return (
      <span key={option.key} className={CHIP_WRAP}>
        {option.key === 'all' ? button : tip(option.label, button)}
      </span>
    );
  });

  const placesChips = EXPLORE_MOBILE_PLACES_MENU.filter((option) => option.key !== 'uae').map((option) => {
    const filterKey = placesChipFilter(option.key);
    const active =
      onPlaces && option.key === placesMenuKey && (option.key !== 'all' || venueRegions.length === 0);
    const iconFilter =
      option.key === 'facilities'
        ? 'facilities'
        : option.key === 'shops'
          ? 'shops'
          : option.key === 'camping'
            ? 'camping'
            : option.key === 'others'
              ? 'others'
              : option.key === 'hiking'
                ? 'trails'
                : 'hiking';
    const button = (
      <button
        type="button"
        onClick={() => handlePlacesPill(option.key)}
        className={`${exploreMapChildChipClass(active, filterKey, 'places')}${option.key === 'all' ? ` ${EXPLORE_MAP_FILTER_ALL_CHIP_CLASS}` : ''}`}
        aria-pressed={active}
        aria-label={option.label}
      >
        {option.key !== 'all' ? (
          <ExploreFilterIcon filter={iconFilter} context="venue" />
        ) : (
          <span className="explore-filter-mark explore-filter-mark--label" aria-hidden>
            All
          </span>
        )}
        {option.key !== 'all' ? <span className="max-lg:hidden">{option.label}</span> : null}
      </button>
    );
    return (
      <span key={option.key} className={CHIP_WRAP}>
        {option.key === 'all' ? button : tip(option.label, button)}
      </span>
    );
  });

  const quoteWell =
    layer === 'places'
      ? 'explore-filter-quote-well--places bg-sky-50 border border-sky-200/80'
      : 'explore-filter-quote-well--events bg-emerald-50 border border-emerald-200/80';
  const quoteDropFill =
    layer === 'places' ? 'explore-filter-quote-fill--places' : 'explore-filter-quote-fill--events';
  const quoteDropStroke =
    layer === 'places' ? 'explore-filter-quote-stroke--places' : 'explore-filter-quote-stroke--events';
  const quoteSeamFill =
    layer === 'places' ? 'bg-sky-50' : 'explore-filter-quote-seam--events bg-emerald-50';

  useLayoutEffect(() => {
    const placeQuoteTail = () => {
      const parent = layer === 'places' ? placesTabRef.current : activityTabRef.current;
      const quote = quoteRef.current;
      if (!parent || !quote) return;
      const parentBox = parent.getBoundingClientRect();
      const quoteBox = quote.getBoundingClientRect();
      const left = Math.min(
        quoteBox.width - 16,
        Math.max(16, parentBox.left + parentBox.width / 2 - quoteBox.left)
      );
      const top = parentBox.bottom - quoteBox.top - 1;
      setQuoteCaret({ left, top });
    };
    placeQuoteTail();
    window.addEventListener('resize', placeQuoteTail);
    window.visualViewport?.addEventListener('resize', placeQuoteTail);
    return () => {
      window.removeEventListener('resize', placeQuoteTail);
      window.visualViewport?.removeEventListener('resize', placeQuoteTail);
    };
  }, [layer, trailing, onOpenExploreSearch]);

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch lg:max-w-[46rem]">
      <div className={`flex flex-col overflow-visible ${EXPLORE_MAP_FROST_TRAY}`}>
      <div className="grid h-9 min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-0.5">
        <div className="flex h-9 min-w-0 items-center justify-start pr-1">
          <div
            className={`flex h-9 w-full min-w-0 items-center gap-0.5 overflow-hidden rounded-full p-0.5 ring-1 ring-black/5 ${EXPLORE_MAP_CHROME_FROST}`}
            role="tablist"
            aria-label="Map layer"
          >
            <button
              ref={activityTabRef}
              type="button"
              role="tab"
              className={`${exploreMapScopeSegmentClass(layer === 'activity', 'activity')} h-full min-w-0 flex-1 !gap-0.5 !px-1 !py-0 !text-[11px]`}
              aria-selected={layer === 'activity'}
              onClick={() => openLayer('activity')}
            >
              <span className="font-emoji shrink-0 text-[0.9375rem] leading-none" aria-hidden>
                {SEEKING_EMOJI}
              </span>
              <span className="whitespace-nowrap">Events</span>
            </button>
            <button
              ref={placesTabRef}
              type="button"
              role="tab"
              className={`${exploreMapScopeSegmentClass(layer === 'places', 'places')} h-full min-w-0 flex-1 !gap-0.5 !px-1 !py-0 !text-[11px]`}
              aria-selected={layer === 'places'}
              onClick={() => openLayer('places')}
            >
              <span className="font-emoji shrink-0 text-[0.9375rem] leading-none" aria-hidden>
                {EXPLORE_PLACES_LAYER_EMOJI}
              </span>
              <span className="whitespace-nowrap">Places</span>
            </button>
          </div>
        </div>
        <div className="relative flex h-9 shrink-0 items-center justify-center px-2.5">
          <span
            className="explore-map-filter-tray-sep absolute inset-y-1.5 left-0 w-px bg-neutral-500/55"
            aria-hidden
          />
          {onOpenExploreSearch
            ? tip(
                'Search',
                <button
                  type="button"
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ring-black/5 md:hidden ${EXPLORE_MAP_CHROME_FROST}`}
                  aria-label="Search explore"
                  onClick={() => onOpenExploreSearch()}
                >
                  <span className="font-emoji" aria-hidden>
                    🔍
                  </span>
                </button>
              )
            : null}
          <span
            className="explore-map-filter-tray-sep absolute inset-y-1.5 right-0 w-px bg-neutral-500/55"
            aria-hidden
          />
        </div>
        {trailing ? (
          <div className="flex h-9 min-w-0 items-center justify-stretch pl-1 [&>*]:w-full">
            {trailing}
          </div>
        ) : (
          <span />
        )}
      </div>

      <div ref={quoteRef} className="relative mt-1 overflow-visible">
        <div
          key={layer}
          className="explore-map-filter-quote-swap relative overflow-visible"
        >
        <svg
          aria-hidden
          viewBox="0 0 20 14"
          width="20"
          height="14"
          className="pointer-events-none absolute z-0 overflow-visible"
          style={{
            left: quoteCaret.left,
            top: 0,
            transform: 'translate(-50%, calc(-100% + 2px))',
          }}
        >
          <path
            className={quoteDropFill}
            d="M1.2 14C1.2 9.2 3.1 6.4 10 1.35C16.9 6.4 18.8 9.2 18.8 14Z"
          />
          <path
            className={`${quoteDropStroke} fill-none`}
            d="M2.05 9C2.05 9 3.4 6.15 10 1.35C16.6 6.15 17.95 9 17.95 9"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div
          className={`relative z-[1] flex min-h-9 w-full min-w-0 items-center overflow-x-auto scrollbar-none rounded-xl pt-1 ${quoteWell}`}
          role="toolbar"
          aria-label={layer === 'places' ? 'Place filters' : 'Event filters'}
        >
        <span
          aria-hidden
          className={`pointer-events-none absolute left-0 top-0 z-[2] h-[3px] w-5 -translate-x-1/2 ${quoteSeamFill}`}
          style={{ left: quoteCaret.left }}
        />
        <div className="relative z-[3] flex min-w-0 flex-1 items-stretch justify-evenly gap-0.5 lg:justify-start lg:gap-1">
          {layer === 'places' ? placesChips : activityChips}
        </div>
        <span className={TRAY_SEP} aria-hidden />
        {layer === 'places' ? (
          <ExploreMapMobileUaePill
            venueRegions={venueRegions}
            onOpen={() => onBrowsePanelChange('venues')}
            onVenueRegionsChange={onVenueRegionsChange}
            pillClassName={exploreMapChildChipClass(venueRegions.length > 0, 'all')}
            wrapClassName="relative shrink-0"
            compact={!isLg}
          />
        ) : (
          <ExploreMapMobileAnydayPill
            activityDatePreset={activityDatePreset}
            onActivityDatePresetChange={onActivityDatePresetChange}
            pillClassName={exploreMapChildChipClass(activityDatePreset !== 'anyday', 'all')}
            wrapClassName="relative shrink-0"
            compact={!isLg}
          />
        )}
        </div>
        </div>
      </div>
      </div>
    </div>
  );
};
