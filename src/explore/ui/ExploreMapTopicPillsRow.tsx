import {
  EXPLORE_FILTER_PILL,
  EXPLORE_MAP_FILTER_INACTIVE,
  exploreMapFilterActiveClass,
} from '../../config/exploreTheme';
import { EXPLORE_MAP_FILTER_PILLS, type ExploreMapFilterPillKey } from '../exploreBrowseTaxonomy';
import { ExploreMapFilterPillIcon } from './ExploreFilterIcon';

type ExploreMapTopicPillsRowProps = {
  selected: readonly ExploreMapFilterPillKey[];
  onToggle: (key: ExploreMapFilterPillKey) => void;
};

const pillActiveClass = (key: ExploreMapFilterPillKey): string => {
  if (key === 'shops') return exploreMapFilterActiveClass('shops');
  if (key === 'looking') return exploreMapFilterActiveClass('others');
  if (key === 'spots') return exploreMapFilterActiveClass('hiking');
  return exploreMapFilterActiveClass('camping');
};

/** Multi-select filter pills for the explore map. */
export const ExploreMapTopicPillsRow = ({ selected, onToggle }: ExploreMapTopicPillsRowProps) => {
  const activeSet = new Set(selected);

  return (
    <div className="min-w-0 overflow-x-auto scroll-smooth scrollbar-none [-webkit-overflow-scrolling:touch]">
      <div className="flex w-max max-w-full flex-nowrap items-center gap-2 pr-2">
        {EXPLORE_MAP_FILTER_PILLS.map((option) => {
          const active = activeSet.has(option.key);
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onToggle(option.key)}
              className={`${EXPLORE_FILTER_PILL.mapTopic} ${
                active ? pillActiveClass(option.key) : EXPLORE_MAP_FILTER_INACTIVE
              }`}
              aria-pressed={active}
            >
              <ExploreMapFilterPillIcon pill={option.key} />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
