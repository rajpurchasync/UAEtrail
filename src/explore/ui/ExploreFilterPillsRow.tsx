import type { MapFilterKey } from '../routing';
import {
  EXPLORE_MAP_FILTER_INACTIVE,
  exploreMapFilterActiveClass,
} from '../../config/exploreTheme';
import { MAP_FILTER_PILLS, placesMapFilterLabel } from '../../config/exploreMapFilters';
import { ExploreFilterIcon, type ExploreFilterEmojiContext } from './ExploreFilterIcon';

const pillClass = (active: boolean, key: MapFilterKey, layout: 'map' | 'list') => {
  const base =
    layout === 'map'
      ? 'touch-target-inline shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold shadow-[0_2px_10px_rgba(15,23,42,.12)] transition'
      : 'inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold shadow-sm transition';
  return `${base} ${active ? exploreMapFilterActiveClass(key) : EXPLORE_MAP_FILTER_INACTIVE}`;
};

export interface ExploreFilterPillsRowProps {
  mapFilter: MapFilterKey;
  onFilterChange: (filter: MapFilterKey) => void;
  allowedKeys?: readonly MapFilterKey[];
  filterEmojiContext?: ExploreFilterEmojiContext;
  layout?: 'map' | 'list';
  className?: string;
}

/** Shared category pills — same labels, emojis, and `filter` URL on map and list. */
export const ExploreFilterPillsRow = ({
  mapFilter,
  onFilterChange,
  allowedKeys,
  filterEmojiContext = 'activity',
  layout = 'map',
  className = '',
}: ExploreFilterPillsRowProps) => {
  const placesLabels = filterEmojiContext === 'venue';
  const pills = allowedKeys
    ? MAP_FILTER_PILLS.filter((pill) => allowedKeys.includes(pill.key))
    : MAP_FILTER_PILLS;

  return (
    <div
      className={`min-w-0 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none py-0.5 [-webkit-overflow-scrolling:touch] ${className}`}
    >
      <div className={`flex w-max max-w-full flex-nowrap items-center gap-2 ${layout === 'map' ? 'pr-4 lg:pr-0' : ''}`}>
        {pills.map((option) => {
          const active = mapFilter === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onFilterChange(option.key)}
              className={pillClass(active, option.key, layout)}
            >
              <ExploreFilterIcon filter={option.key} context={filterEmojiContext} />
              {placesLabels ? placesMapFilterLabel(option.key) : option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
