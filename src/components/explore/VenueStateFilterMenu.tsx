import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { getVenueStateFilterOptions } from '../../config/regions';
import { FilterIconButton } from '../mobile/FilterIconButton';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';

interface VenueStateFilterMenuProps {
  selected: string[];
  onChange: (next: string[]) => void;
}

/** Multi-select state/emirate filter for venue browse lists. */
export const VenueStateFilterMenu = ({ selected, onChange }: VenueStateFilterMenuProps) => {
  const [open, setOpen] = useState(false);
  const options = getVenueStateFilterOptions();

  const toggle = (key: string) => {
    onChange(selected.includes(key) ? selected.filter((region) => region !== key) : [...selected, key]);
  };

  return (
    <>
      <FilterIconButton
        onClick={() => setOpen(true)}
        active={selected.length > 0}
        badge={selected.length}
        aria-label="Filter venues by state"
        className="shrink-0"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </FilterIconButton>

      <ExploreResponsiveSheet open={open} onClose={() => setOpen(false)} maxWidthClass="lg:max-w-sm">
        <div className="px-4 pb-6 pt-1 lg:pt-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Filter by state</h3>
              <p className="mt-1 text-xs text-gray-500">Select one or more emirates</p>
            </div>
            {selected.length > 0 ? (
              <button
                type="button"
                onClick={() => onChange([])}
                className="shrink-0 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Clear all
              </button>
            ) : null}
          </div>

          <div className="space-y-1">
            {options.map((option) => {
              const checked = selected.includes(option.key);
              return (
                <label
                  key={option.key}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
                    checked ? 'bg-emerald-50 ring-1 ring-emerald-100' : 'hover:bg-neutral-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(option.key)}
                    className="h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-900">{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </ExploreResponsiveSheet>
    </>
  );
};
