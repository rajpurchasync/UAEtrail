import type { MapFilterKey } from '../routing';
import {
  EXPLORE_MAP_FILTER_INACTIVE,
  EXPLORE_MOBILE_MAP_CHROME,
  EXPLORE_Z,
  exploreMapFilterActiveClass,
} from '../../config/exploreTheme';
import { MAP_FILTER_PILLS } from '../../config/exploreMapFilters';
import { ExploreFilterIcon } from './ExploreFilterIcon';

interface ExploreMapFilterBarProps {
  mapFilter: MapFilterKey;
  onFilterChange: (filter: MapFilterKey) => void;
  /** Desktop browse tab restricts visible pills. */
  allowedKeys?: readonly MapFilterKey[];
  className?: string;
}

const filterPillClass = (active: boolean, key: MapFilterKey) =>
  `touch-target-inline shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold shadow-[0_2px_10px_rgba(15,23,42,.12)] transition ${
    active ? exploreMapFilterActiveClass(key) : EXPLORE_MAP_FILTER_INACTIVE
  }`;

export const ExploreMapFilterBar = ({
  mapFilter,
  onFilterChange,
  allowedKeys,
  className = '',
}: ExploreMapFilterBarProps) => {
  const pills = allowedKeys
    ? MAP_FILTER_PILLS.filter((pill) => allowedKeys.includes(pill.key))
    : MAP_FILTER_PILLS;

  return (
    <div
      className={`pointer-events-none absolute top-3 max-lg:inset-x-0 max-lg:pl-4 lg:left-4 lg:right-4 lg:top-4 ${EXPLORE_MOBILE_MAP_CHROME.filterTop} ${EXPLORE_Z.mapFilters} ${className}`}
    >
      <div className="pointer-events-auto min-w-0 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none py-1 [-webkit-overflow-scrolling:touch]">
        <div className="flex w-max flex-nowrap items-center gap-2 pr-4 lg:pr-0">
          {pills.map((option) => {
            const active = mapFilter === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onFilterChange(option.key)}
                className={`inline-flex ${filterPillClass(active, option.key)}`}
              >
                <ExploreFilterIcon filter={option.key} />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
