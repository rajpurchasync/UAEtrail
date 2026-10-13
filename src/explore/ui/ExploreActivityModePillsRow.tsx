import type { ExploreActivityModeFilter } from '../exploreActivityModeFilter';
import { EXPLORE_FILTER_PILL, EXPLORE_LIST_PILLS_SCROLL, EXPLORE_MAP_FILTER_INACTIVE } from '../../config/exploreTheme';

const OPTIONS: ReadonlyArray<{ key: ExploreActivityModeFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'hosted', label: 'Hosted' },
  { key: 'seeking', label: 'Seeking' },
];

type ExploreActivityModePillsRowProps = {
  value: ExploreActivityModeFilter;
  onChange: (next: ExploreActivityModeFilter) => void;
  layout?: 'map' | 'list';
  className?: string;
};

/** Activities layer — hosted publish vs member seeking (§2.5 / §3.2). */
export const ExploreActivityModePillsRow = ({
  value,
  onChange,
  layout = 'map',
  className = '',
}: ExploreActivityModePillsRowProps) => {
  const base = layout === 'map' ? EXPLORE_FILTER_PILL.map : EXPLORE_FILTER_PILL.list;
  const scrollClass =
    layout === 'list'
      ? EXPLORE_LIST_PILLS_SCROLL
      : 'min-w-0 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none py-0.5';

  return (
    <div className={`${scrollClass} ${className}`}>
      <div className="flex w-max flex-nowrap items-center gap-2">
        {OPTIONS.map((option) => {
          const active = value === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange(option.key)}
              className={`${base} ${
                active
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                  : EXPLORE_MAP_FILTER_INACTIVE
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
