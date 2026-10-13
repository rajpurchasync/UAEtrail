import { useEffect, useState } from 'react';
import { ConsumerBottomSheet } from '../../components/mobile/ConsumerBottomSheet';
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
import { listChipClass } from '../listChromeTheme';

interface ListCategoryMoreFiltersSheetProps {
  open: boolean;
  onClose: () => void;
  category: BrowseMainCategoryKey;
  applied: BrowseListFilterState;
  regions: string[];
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

export const ListCategoryMoreFiltersSheet = ({
  open,
  onClose,
  category,
  applied,
  regions,
  onApply,
}: ListCategoryMoreFiltersSheetProps) => {
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

  const showPrice = category === 'trips';
  const showWhen = category === 'trips';
  const showArea = category === 'venues';

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
    onClose();
  };

  return (
    <ConsumerBottomSheet
      open={open}
      title="Filters"
      subtitle="Price, timing, and area"
      onClose={onClose}
      zIndex={1300}
      headerAddon={
        <button type="button" onClick={reset} className="mt-2 text-sm font-semibold text-emerald-700">
          Reset
        </button>
      }
      footer={
        <button type="button" onClick={apply} className={`min-h-12 w-full rounded-2xl text-sm font-bold ${EXPLORE_BRAND_ACTIVE}`}>
          Show results
        </button>
      }
    >
      <div className="space-y-6">
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
    </ConsumerBottomSheet>
  );
};
