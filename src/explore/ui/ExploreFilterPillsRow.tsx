import type { MapFilterKey } from '../routing';
import {
  EXPLORE_FILTER_PILL,
  EXPLORE_LIST_PILLS_SCROLL,
  EXPLORE_MAP_FILTER_INACTIVE,
  exploreMapFilterActiveClass,
} from '../../config/exploreTheme';
import { MAP_FILTER_PILLS, placesMapFilterLabel } from '../../config/exploreMapFilters';
import { ExploreFilterIcon, type ExploreFilterEmojiContext } from './ExploreFilterIcon';

const pillClass = (active: boolean, key: MapFilterKey, layout: 'map' | 'list') => {
  const base = layout === 'map' ? EXPLORE_FILTER_PILL.map : EXPLORE_FILTER_PILL.list;
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

  const scrollClass =
    layout === 'list'
      ? EXPLORE_LIST_PILLS_SCROLL
      : 'min-w-0 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none py-0.5 [-webkit-overflow-scrolling:touch]';

  return (
    <div className={`${scrollClass} ${className}`}>
      <div className={`flex w-max flex-nowrap items-center gap-2 ${layout === 'map' ? 'min-w-full pr-2 lg:pr-0' : ''}`}>
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
