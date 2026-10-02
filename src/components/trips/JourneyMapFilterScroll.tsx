import { useMemo } from 'react';
import type { OutdoorMapEntryDTO, OutdoorMapFilterCategory } from '@uaetrail/shared-types';
import { FilterChips } from '../mobile/FilterChips';
import { JOURNEY_MAP_FILTERS, countJourneyMapEntries } from '../../trips/journeyMapFilters';

interface JourneyMapFilterScrollProps {
  filter: OutdoorMapFilterCategory;
  entries: OutdoorMapEntryDTO[];
  onChange: (filter: OutdoorMapFilterCategory) => void;
  variant?: 'inline' | 'overlay';
}

/** Trips journey map filters — shared chip row (neutral), optional map overlay chrome. */
export const JourneyMapFilterScroll = ({
  filter,
  entries,
  onChange,
  variant = 'inline',
}: JourneyMapFilterScrollProps) => {
  const options = useMemo(
    () =>
      JOURNEY_MAP_FILTERS.map((tab) => {
        const count = countJourneyMapEntries(entries, tab.id);
        const label = count > 0 ? `${tab.label} (${count})` : tab.label;
        return { key: tab.id, label };
      }),
    [entries]
  );

  if (variant === 'overlay') {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-2 z-[450] px-3">
        <div className="pointer-events-auto rounded-2xl bg-white/90 p-1.5 shadow-md ring-1 ring-neutral-200/80 backdrop-blur-md">
          <FilterChips
            variant="neutral"
            options={options}
            value={filter}
            onChange={onChange}
          />
        </div>
      </div>
    );
  }

  return (
    <FilterChips
      className="-mx-4 px-4"
      variant="neutral"
      options={options}
      value={filter}
      onChange={onChange}
    />
  );
};
