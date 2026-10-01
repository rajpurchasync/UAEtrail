import type { OutdoorMapEntryDTO, OutdoorMapFilterCategory } from '@uaetrail/shared-types';
import { OUTDOOR_MAP_FILTERS, countOutdoorEntries } from '../../trips/outdoorMapFilters';

interface OutdoorMapFilterScrollProps {
  filter: OutdoorMapFilterCategory;
  entries: OutdoorMapEntryDTO[];
  onChange: (filter: OutdoorMapFilterCategory) => void;
  /** Tighter padding when overlaid on the map. */
  variant?: 'inline' | 'overlay';
}

/** Outdoor map filters — same pill styling as TripsSegmentScroll. */
export const OutdoorMapFilterScroll = ({
  filter,
  entries,
  onChange,
  variant = 'inline',
}: OutdoorMapFilterScrollProps) => {
  const wrapClass =
    variant === 'overlay'
      ? 'pointer-events-none absolute inset-x-0 top-2 z-[450] px-3'
      : '-mx-4 overflow-x-auto px-4 scrollbar-none';

  const rowClass =
    variant === 'overlay'
      ? 'pointer-events-auto flex min-w-min gap-2 rounded-2xl bg-white/90 p-1.5 shadow-md ring-1 ring-neutral-200/80 backdrop-blur-md'
      : 'flex min-w-min gap-2 pb-1';

  return (
    <div className={wrapClass}>
      <div className={rowClass}>
        {OUTDOOR_MAP_FILTERS.map((tab) => {
          const active = tab.id === filter;
          const count = countOutdoorEntries(entries, tab.id);
          const label = count > 0 ? `${tab.label} (${count})` : tab.label;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.98] ${
                active
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-white text-neutral-700 ring-1 ring-neutral-200/90'
              }`}
              aria-pressed={active}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
