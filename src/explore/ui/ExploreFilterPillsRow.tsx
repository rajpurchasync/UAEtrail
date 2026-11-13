import { useRef } from 'react';
import type { MapFilterKey } from '../routing';
import { useHorizontalDragScroll } from '../../hooks/useHorizontalDragScroll';
import {
  EXPLORE_COMPACT_PILL_GRID,
  EXPLORE_COMPACT_PILL_LABEL,
  EXPLORE_FILTER_PILL,
  EXPLORE_MAP_FILTER_INACTIVE,
  exploreMapFilterActiveClass,
} from '../../config/exploreTheme';
import { MAP_FILTER_PILLS, placesMapFilterLabel } from '../../config/exploreMapFilters';
import { ExploreFilterIcon, type ExploreFilterEmojiContext } from './ExploreFilterIcon';

const pillClass = (active: boolean, key: MapFilterKey, layout: 'map' | 'list') => {
  const base =
    layout === 'map' ? EXPLORE_FILTER_PILL.map : EXPLORE_FILTER_PILL.listStacked;
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
  const scrollRef = useRef<HTMLDivElement>(null);
  useHorizontalDragScroll(scrollRef);
  const placesLabels = filterEmojiContext === 'venue';
  const pills = allowedKeys
    ? MAP_FILTER_PILLS.filter((pill) => allowedKeys.includes(pill.key))
    : MAP_FILTER_PILLS;

  const scrollClass =
    layout === 'list'
      ? 'w-full min-w-0'
      : 'min-w-0 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none py-0.5 [-webkit-overflow-scrolling:touch]';

  const innerClass =
    layout === 'list'
      ? EXPLORE_COMPACT_PILL_GRID
      : `flex w-max flex-nowrap items-center min-w-full gap-2 pr-2 lg:pr-0`;

  const innerStyle =
    layout === 'list'
      ? { gridTemplateColumns: `repeat(${pills.length}, minmax(0, 1fr))` }
      : undefined;

  return (
    <div ref={scrollRef} className={`${scrollClass} ${className}`}>
      <div className={innerClass} style={innerStyle}>
        {pills.map((option) => {
          const active = mapFilter === option.key;
          const label = placesLabels ? placesMapFilterLabel(option.key) : option.label;
          const icon = (
            <ExploreFilterIcon
              filter={option.key}
              context={filterEmojiContext}
              className={layout === 'list' ? 'text-sm leading-none' : undefined}
            />
          );
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onFilterChange(option.key)}
              className={pillClass(active, option.key, layout)}
            >
              {layout === 'list' ? (
                <>
                  {icon}
                  <span className={EXPLORE_COMPACT_PILL_LABEL}>{label}</span>
                </>
              ) : (
                <>
                  {icon}
                  {label}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
