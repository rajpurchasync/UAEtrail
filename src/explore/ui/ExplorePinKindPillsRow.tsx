import { useRef } from 'react';
import { useHorizontalDragScroll } from '../../hooks/useHorizontalDragScroll';
import {
  EXPLORE_FILTER_PILL,
  EXPLORE_MAP_FILTER_INACTIVE,
  exploreMapFilterActiveClass,
} from '../../config/exploreTheme';
import { EXPLORE_PIN_KIND_PILLS, type ExplorePinKindFilter } from '../explorePinKindFilter';

type ExplorePinKindPillsRowProps = {
  pinKind: ExplorePinKindFilter;
  onPinKindChange: (pinKind: ExplorePinKindFilter) => void;
  layout?: 'map' | 'list';
  className?: string;
};

/** Second filter row — same pill chrome as other explore filter rows. */
export const ExplorePinKindPillsRow = ({
  pinKind,
  onPinKindChange,
  layout = 'map',
  className = '',
}: ExplorePinKindPillsRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useHorizontalDragScroll(scrollRef);
  return (
  <div
    ref={scrollRef}
    className={`min-w-0 overflow-x-auto scroll-smooth scrollbar-none py-0.5 [-webkit-overflow-scrolling:touch] ${className}`}
  >
    <div
      className={`flex w-max max-w-full flex-nowrap items-center gap-2 ${layout === 'map' ? 'min-w-full pr-2 lg:pr-0' : ''}`}
    >
      {EXPLORE_PIN_KIND_PILLS.map((option) => {
        const active = pinKind === option.key;
        const base = layout === 'map' ? EXPLORE_FILTER_PILL.sub : EXPLORE_FILTER_PILL.subList;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onPinKindChange(option.key)}
            className={`${base} ${active ? exploreMapFilterActiveClass('all') : EXPLORE_MAP_FILTER_INACTIVE}`}
            aria-pressed={active}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  </div>
  );
};
