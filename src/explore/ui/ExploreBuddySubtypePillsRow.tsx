import {
  BUDDY_SUBTYPE_PILLS,
  type ExploreBuddySubtypeKey,
} from '../exploreBuddySubtype';
import {
  EXPLORE_FILTER_PILL,
  EXPLORE_LIST_PILLS_SCROLL,
  EXPLORE_MAP_FILTER_INACTIVE,
  exploreMapFilterActiveClass,
} from '../../config/exploreTheme';

type ExploreBuddySubtypePillsRowProps = {
  subtype: ExploreBuddySubtypeKey;
  onSubtypeChange: (subtype: ExploreBuddySubtypeKey) => void;
  layout?: 'map' | 'list';
  className?: string;
};

/** Secondary row when primary filter is Others — events vs general activities. */
export const ExploreBuddySubtypePillsRow = ({
  subtype,
  onSubtypeChange,
  layout = 'map',
  className = '',
}: ExploreBuddySubtypePillsRowProps) => {
  const scrollClass =
    layout === 'list'
      ? EXPLORE_LIST_PILLS_SCROLL
      : 'min-w-0 overflow-x-auto scroll-smooth scrollbar-none py-0.5 [-webkit-overflow-scrolling:touch]';

  return (
  <div className={`${scrollClass} ${className}`}>
    <div
      className={`flex w-max max-w-full flex-nowrap items-center gap-2 ${layout === 'map' ? 'min-w-full pr-2 lg:pr-0' : ''}`}
    >
      {BUDDY_SUBTYPE_PILLS.map((option) => {
        const active = subtype === option.key;
        const base = layout === 'map' ? EXPLORE_FILTER_PILL.sub : EXPLORE_FILTER_PILL.subList;
        const activeClass =
          option.key === 'all'
            ? 'bg-violet-700 text-white border-violet-800 shadow-sm shadow-violet-900/20'
            : exploreMapFilterActiveClass('others');
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onSubtypeChange(option.key)}
            className={`${base} ${active ? activeClass : EXPLORE_MAP_FILTER_INACTIVE}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  </div>
  );
};
