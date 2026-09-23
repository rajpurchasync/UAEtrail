import { SlidersHorizontal } from 'lucide-react';
import type { MapFilterKey } from '../routing';
import {
  EXPLORE_MAP_FILTER_INACTIVE,
  EXPLORE_MOBILE_MAP_CHROME,
  EXPLORE_Z,
  exploreMapFilterActiveClass,
} from '../../config/exploreTheme';
import {
  MAP_FILTER_PILLS,
  MOBILE_MORE_MAP_FILTER_KEYS,
  MOBILE_PRIMARY_MAP_FILTER_KEYS,
  isMobileMoreMapFilter,
  mapFilterLabel,
} from '../../config/exploreMapFilters';
import { ExploreFilterIcon } from './ExploreFilterIcon';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';

interface ExploreMapFilterBarProps {
  mapFilter: MapFilterKey;
  onFilterChange: (filter: MapFilterKey) => void;
  isDesktop: boolean;
  /** Desktop browse tab restricts visible pills. */
  allowedKeys?: readonly MapFilterKey[];
  moreOpen: boolean;
  onMoreOpenChange: (open: boolean) => void;
  className?: string;
}

const filterPillClass = (active: boolean, key: MapFilterKey) =>
  `touch-target-inline shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold shadow-[0_2px_10px_rgba(15,23,42,.12)] transition ${
    active ? exploreMapFilterActiveClass(key) : EXPLORE_MAP_FILTER_INACTIVE
  }`;

export const ExploreMapFilterBar = ({
  mapFilter,
  onFilterChange,
  isDesktop,
  allowedKeys,
  moreOpen,
  onMoreOpenChange,
  className = '',
}: ExploreMapFilterBarProps) => {
  const allPills = allowedKeys
    ? MAP_FILTER_PILLS.filter((pill) => allowedKeys.includes(pill.key))
    : MAP_FILTER_PILLS;

  const visiblePills = isDesktop
    ? allPills
    : MAP_FILTER_PILLS.filter((pill) => MOBILE_PRIMARY_MAP_FILTER_KEYS.includes(pill.key));

  const morePills = isDesktop ? [] : MAP_FILTER_PILLS.filter((pill) => MOBILE_MORE_MAP_FILTER_KEYS.includes(pill.key));

  const moreActive = !isDesktop && isMobileMoreMapFilter(mapFilter);

  const selectFilter = (key: MapFilterKey) => {
    onFilterChange(key);
    onMoreOpenChange(false);
  };

  return (
    <>
      <div
        className={`pointer-events-none absolute top-3 max-lg:inset-x-0 max-lg:pl-4 lg:left-4 lg:right-4 lg:top-4 ${EXPLORE_MOBILE_MAP_CHROME.filterTop} ${EXPLORE_Z.mapFilters} ${className}`}
      >
        <div className="pointer-events-auto min-w-0 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none py-1 [-webkit-overflow-scrolling:touch]">
          <div className="flex w-max flex-nowrap items-center gap-2 pr-0">
            {visiblePills.map((option) => {
              const active = mapFilter === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => selectFilter(option.key)}
                  className={`inline-flex ${filterPillClass(active, option.key)}`}
                >
                  <ExploreFilterIcon filter={option.key} />
                  {option.label}
                </button>
              );
            })}

            {!isDesktop && morePills.length > 0 ? (
              <button
                type="button"
                onClick={() => onMoreOpenChange(true)}
                className={`inline-flex ${filterPillClass(moreActive, mapFilter)}`}
                aria-expanded={moreOpen}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                {moreActive ? mapFilterLabel(mapFilter) : 'More'}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {!isDesktop ? (
        <ExploreResponsiveSheet open={moreOpen} onClose={() => onMoreOpenChange(false)} maxWidthClass="lg:max-w-sm">
          <div className="px-4 pb-[calc(var(--safe-bottom)+16px)] pt-1 lg:px-6 lg:pb-6">
            <h2 className="text-lg font-bold text-neutral-900">More map filters</h2>
            <p className="mt-1 text-sm text-neutral-500">Rideshare, events, and shops on the map.</p>
            <div className="mt-4 flex flex-col gap-2">
              {morePills.map((option) => {
                const active = mapFilter === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => selectFilter(option.key)}
                    className={`touch-target-row flex w-full items-center gap-3 rounded-2xl border px-4 text-left text-sm font-semibold transition ${
                      active
                        ? `${exploreMapFilterActiveClass(option.key)} border-transparent`
                        : 'border-neutral-200 bg-white text-neutral-800'
                    }`}
                  >
                    <ExploreFilterIcon filter={option.key} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </ExploreResponsiveSheet>
      ) : null}
    </>
  );
};
