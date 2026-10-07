import { useEffect, useId, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { EXPLORE_BRAND_ACTIVE } from '../../config/exploreTheme';
import { getVenueStateFilterOptions } from '../../config/regions';
import {
  BROWSE_PRICE_OPTIONS,
  BROWSE_WHEN_OPTIONS,
  type BrowseListFilterState,
  type BrowsePriceFilter,
  type BrowseWhenFilter,
} from '../browseListFilters';
import type { BrowseMainCategoryKey } from '../browseListTaxonomy';
import { LIST_FILTERS_CHIP_BADGE, listChipClass, listFilterIconButtonClass } from '../listChromeTheme';

interface ListCategoryMoreFiltersMenuProps {
  category: BrowseMainCategoryKey;
  applied: BrowseListFilterState;
  regions: string[];
  moreFiltersActive: boolean;
  onApply: (patch: Partial<BrowseListFilterState> & { regions?: string[] }) => void;
}

const SegmentRow = <T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ key: T; label: string }>;
  value: T;
  onChange: (key: T) => void;
}) => (
  <div className="space-y-2">
    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
    <div className="flex flex-wrap gap-2">
      {options.map(({ key, label: optionLabel }) => (
        <button key={key} type="button" onClick={() => onChange(key)} className={listChipClass(value === key)}>
          {optionLabel}
        </button>
      ))}
    </div>
  </div>
);

/** Price / weekend / area — anchored popover beside the filter icon. */
export const ListCategoryMoreFiltersMenu = ({
  category,
  applied,
  regions,
  moreFiltersActive,
  onApply,
}: ListCategoryMoreFiltersMenuProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [price, setPrice] = useState<BrowsePriceFilter>(applied.price);
  const [when, setWhen] = useState<BrowseWhenFilter>(applied.when);
  const [draftRegions, setDraftRegions] = useState(regions);

  useEffect(() => {
    if (open) {
      setPrice(applied.price);
      setWhen(applied.when);
      setDraftRegions(regions);
    }
  }, [open, applied.price, applied.when, regions]);

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

  const showPrice = category === 'trips' || category === 'shops';
  const showWhen = category === 'trips';
  const showArea = category === 'venues' || category === 'shops';

  const reset = () => {
    setPrice('all');
    setWhen('any');
    setDraftRegions([]);
  };

  const apply = () => {
    onApply({
      price: showPrice ? price : applied.price,
      when: showWhen ? when : applied.when,
      regions: showArea ? draftRegions : regions,
    });
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`relative ${listFilterIconButtonClass()}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        aria-label="Price, date, and area filters"
      >
        <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden />
        {moreFiltersActive ? <span className={LIST_FILTERS_CHIP_BADGE} aria-hidden /> : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Filters"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[3100] w-[min(100vw-2rem,20rem)]"
        >
          <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_12px_40px_rgba(15,23,42,.18)]">
            <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-neutral-950">Filters</p>
                <p className="text-xs text-neutral-500">Price, timing, and area</p>
              </div>
              <button type="button" onClick={reset} className="text-xs font-semibold text-emerald-700">
                Reset
              </button>
            </div>
            <div className="max-h-[min(50dvh,20rem)] space-y-5 overflow-y-auto px-4 py-4">
              {showPrice ? (
                <SegmentRow label="Price" options={BROWSE_PRICE_OPTIONS} value={price} onChange={setPrice} />
              ) : null}
              {showWhen ? (
                <SegmentRow
                  label="Weekend"
                  options={BROWSE_WHEN_OPTIONS.filter((option) => option.key === 'any' || option.key === 'weekend')}
                  value={when}
                  onChange={setWhen}
                />
              ) : null}
              {showArea ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Area</p>
                  <div className="space-y-1">
                    {getVenueStateFilterOptions().map((option) => {
                      const checked = draftRegions.includes(option.key);
                      return (
                        <label
                          key={option.key}
                          className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 ${
                            checked ? 'bg-emerald-50 ring-1 ring-emerald-100' : 'hover:bg-neutral-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setDraftRegions((prev) =>
                                prev.includes(option.key)
                                  ? prev.filter((r) => r !== option.key)
                                  : [...prev, option.key]
                              )
                            }
                            className="h-4 w-4 rounded border-neutral-300 text-emerald-600"
                          />
                          <span className="text-sm font-medium text-neutral-900">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="border-t border-neutral-100 p-3">
              <button
                type="button"
                onClick={apply}
                className={`min-h-11 w-full rounded-2xl text-sm font-bold ${EXPLORE_BRAND_ACTIVE}`}
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
