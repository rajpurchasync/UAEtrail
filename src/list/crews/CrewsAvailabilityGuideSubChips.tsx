import { LIST_CHIP_SCROLL, listCategoryPillClass } from '../browse/listChromeTheme';
import type { CrewsAvailabilityGuideFilter } from './crewsOpenSegment';

const GUIDE_FILTER_LABELS: Record<CrewsAvailabilityGuideFilter, string> = {
  all: 'Everyone available',
  guide: 'Guides',
};

type CrewsAvailabilityGuideSubChipsProps = {
  filter: CrewsAvailabilityGuideFilter;
  onFilterChange: (filter: CrewsAvailabilityGuideFilter) => void;
};

const GUIDE_FILTER_ORDER: CrewsAvailabilityGuideFilter[] = ['all', 'guide'];

export const CrewsAvailabilityGuideSubChips = ({
  filter,
  onFilterChange,
}: CrewsAvailabilityGuideSubChipsProps) => (
  <div
    className={`${LIST_CHIP_SCROLL} mb-3 min-w-0 max-w-full snap-x px-0.5`}
    role="group"
    aria-label="Available as guide filter"
  >
    {GUIDE_FILTER_ORDER.map((key) => {
      const active = filter === key;
      return (
        <button
          key={key}
          type="button"
          className={listCategoryPillClass(active)}
          aria-pressed={active}
          onClick={(event) => {
            event.preventDefault();
            onFilterChange(key);
          }}
        >
          {GUIDE_FILTER_LABELS[key]}
        </button>
      );
    })}
  </div>
);