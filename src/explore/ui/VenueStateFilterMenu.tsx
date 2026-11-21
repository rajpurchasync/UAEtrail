import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useVenueStateFilterOptions } from '../../config/useVenueStateFilterOptions';
import { FilterIconButton } from '../../components/mobile/FilterIconButton';
import { EXPLORE_BROWSE_SHEET_CONTROL } from '../../config/exploreTheme';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';

interface VenueStateFilterMenuProps {
  selected: string[];
  onChange: (next: string[]) => void;
  /** Match browse search-row calendar pill (desktop Places tab). */
  toolbarTrigger?: boolean;
}

/** Multi-select state/emirate filter for venue browse lists. */
export const VenueStateFilterMenu = ({
  selected,
  onChange,
  toolbarTrigger = false,
}: VenueStateFilterMenuProps) => {
  const [open, setOpen] = useState(false);
  const options = useVenueStateFilterOptions();
  const active = selected.length > 0;

  const toggle = (key: string) => {
    onChange(selected.includes(key) ? selected.filter((region) => region !== key) : [...selected, key]);
  };

  const trigger = toolbarTrigger ? (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={`${EXPLORE_BROWSE_SHEET_CONTROL} relative h-10 w-10 ${
        active ? 'ring-2 ring-emerald-500/40' : ''
      }`}
      aria-label={
        active ? `Filter places by state (${selected.length} selected)` : 'Filter places by state'
      }
      title="Filter by state"
    >
      <SlidersHorizontal className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
      {active ? (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold text-white"
          aria-hidden
        >
          {selected.length}
        </span>
      ) : null}
    </button>
  ) : (
    <FilterIconButton
      onClick={() => setOpen(true)}
      active={active}
      badge={selected.length}
      aria-label="Filter venues by state"
      className="shrink-0"
    >
      <SlidersHorizontal className="h-4 w-4" />
    </FilterIconButton>
  );

  return (
    <>
      {trigger}

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
