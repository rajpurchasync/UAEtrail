import { useRef } from 'react';
import { OUTING_TOPIC_PILLS, type ExploreOutingTopicKey } from '../exploreOutingTopic';
import { useHorizontalDragScroll } from '../../hooks/useHorizontalDragScroll';
import {
  EXPLORE_FILTER_PILL,
  EXPLORE_LIST_PILLS_SCROLL,
  EXPLORE_MAP_FILTER_INACTIVE,
  exploreMapFilterActiveClass,
} from '../../config/exploreTheme';

type ExploreOutingTopicPillsRowProps = {
  topic: ExploreOutingTopicKey;
  onTopicChange: (topic: ExploreOutingTopicKey) => void;
  layout?: 'map' | 'list';
  className?: string;
};

/** Third drill-down row: activity topics when Others → Activities is selected. */
export const ExploreOutingTopicPillsRow = ({
  topic,
  onTopicChange,
  layout = 'map',
  className = '',
}: ExploreOutingTopicPillsRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useHorizontalDragScroll(scrollRef);
  const scrollClass =
    layout === 'list'
      ? EXPLORE_LIST_PILLS_SCROLL
      : 'min-w-0 overflow-x-auto scroll-smooth scrollbar-none py-0.5 [-webkit-overflow-scrolling:touch]';

  return (
  <div ref={scrollRef} className={`${scrollClass} ${className}`}>
    <div
      className={`flex w-max max-w-full flex-nowrap items-center gap-2 ${layout === 'map' ? 'min-w-full pr-2 lg:pr-0' : ''}`}
    >
      {OUTING_TOPIC_PILLS.map((option) => {
        const active = topic === option.key;
        const base = layout === 'map' ? EXPLORE_FILTER_PILL.sub : EXPLORE_FILTER_PILL.subList;
        const activeClass =
          option.key === 'all'
            ? 'bg-violet-700 text-white border-violet-800 shadow-sm shadow-violet-900/20'
            : exploreMapFilterActiveClass('others');
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onTopicChange(option.key)}
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
