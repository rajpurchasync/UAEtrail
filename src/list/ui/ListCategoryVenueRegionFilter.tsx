import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { getVenueStateFilterOptions } from '../../config/regions';
import { listCategoryPillClass } from '../listChromeTheme';

interface ListCategoryVenueRegionFilterProps {
  venueRegions: string[];
  onVenueRegionsChange: (regions: string[]) => void;
}

const resolveRegionTriggerLabel = (selected: string[]): string => {
  if (selected.length === 0) return 'all areas';
  if (selected.length === 1) {
    const option = getVenueStateFilterOptions().find((o) => o.key === selected[0]);
    return option?.label ?? selected[0]!;
  }
  return `${selected.length} areas`;
};

/** Trails & Spots — emirate filter as text + dropdown (pairs with trips “anyday”). */
export const ListCategoryVenueRegionFilter = ({
  venueRegions,
  onVenueRegionsChange,
}: ListCategoryVenueRegionFilterProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const options = getVenueStateFilterOptions();
  const active = venueRegions.length > 0;
  const label = resolveRegionTriggerLabel(venueRegions);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  const toggle = (key: string) => {
    onVenueRegionsChange(
      venueRegions.includes(key) ? venueRegions.filter((region) => region !== key) : [...venueRegions, key]
    );
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={listCategoryPillClass(active)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="listbox"
        aria-label={active ? `Areas: ${label}` : 'Filter by area'}
      >
        <span className="max-w-[6.5rem] truncate">{label}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" strokeWidth={2.25} aria-hidden />
      </button>

      {open ? (
        <div
          id={panelId}
          role="listbox"
          aria-label="Filter places by emirate"
          aria-multiselectable="true"
          className="absolute left-0 top-[calc(100%+0.5rem)] z-[3100] min-w-[12rem]"
        >
          <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white py-1 shadow-[0_12px_40px_rgba(15,23,42,.18)]">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-3.5 py-2">
              <span className="text-xs font-semibold text-neutral-600">Emirates</span>
              {active ? (
                <button
                  type="button"
                  onClick={() => onVenueRegionsChange([])}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Clear
                </button>
              ) : null}
            </div>
            {options.map((option) => {
              const selected = venueRegions.includes(option.key);
              return (
                <button
                  key={option.key}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => toggle(option.key)}
                  className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${
                    selected ? 'bg-emerald-50 text-emerald-950' : 'text-neutral-950 hover:bg-neutral-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {selected ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
