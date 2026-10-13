import { useEffect, useState } from 'react';
import { ConsumerBottomSheet } from '../../components/mobile/ConsumerBottomSheet';
import { EXPLORE_BRAND_ACTIVE } from '../../config/exploreTheme';
import { getVenueStateFilterOptions } from '../../config/regions';
import {
  EXPLORE_ACTIVITY_DATE_PRESET_OPTIONS,
  type ExploreActivityDatePreset,
} from '../../explore/exploreActivityDateFilter';
import type { BrowseTripTopicKey } from '../browseListTripTopics';
import { toggleBrowseTripTopicInList } from '../browseListTripTopics';
import { BROWSE_MAIN_CATEGORY_LABELS } from '../browseListTaxonomy';
import {
  BROWSE_PRICE_OPTIONS,
  BROWSE_WHEN_OPTIONS,
  type BrowseListFilterState,
  type BrowsePriceFilter,
  type BrowseWhenFilter,
} from '../browseListFilters';
import type { BrowseMainCategoryKey } from '../browseListTaxonomy';
import { BROWSE_TRIP_TOPIC_FILTERS } from '../browseListTripTopics';
import { listChipClass } from '../listChromeTheme';

interface ListRefineSheetProps {
  open: boolean;
  onClose: () => void;
  applied: BrowseListFilterState;
  regions: string[];
  onApply: (state: BrowseListFilterState, regions: string[]) => void;
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

export const ListRefineSheet = ({ open, onClose, applied, regions, onApply }: ListRefineSheetProps) => {
  const [draft, setDraft] = useState(applied);
  const [draftRegions, setDraftRegions] = useState(regions);

  useEffect(() => {
    if (open) {
      setDraft(applied);
      setDraftRegions(regions);
    }
  }, [open, applied, regions]);

  const toggleCategory = (key: BrowseMainCategoryKey) => {
    setDraft((prev) => {
      const set = new Set(prev.categories);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      return { ...prev, categories: [...set] };
    });
  };

  const clearAll = () => {
    setDraft({
      query: draft.query,
      categories: [],
      tripTopics: [],
      placeTopics: [],
      tripLookingOnly: false,
      price: 'all',
      when: 'any',
      activityDatePreset: 'anyday',
      buddiesSegment: 'going',
    });
    setDraftRegions([]);
  };

  const apply = () => {
    onApply(draft, draftRegions);
    onClose();
  };

  return (
    <ConsumerBottomSheet
      open={open}
      title="Refine"
      subtitle="Plans, places, and timing"
      onClose={onClose}
      zIndex={1300}
      headerAddon={
        <button type="button" onClick={clearAll} className="mt-2 text-sm font-semibold text-emerald-700">
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
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Show</p>
          <div className="flex flex-wrap gap-2">
            {BROWSE_MAIN_CATEGORY_LABELS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleCategory(key)}
                className={listChipClass(draft.categories.includes(key))}
                aria-pressed={draft.categories.includes(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Trip type</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDraft((p) => ({ ...p, tripTopics: [], tripLookingOnly: false }))}
              className={listChipClass(draft.tripTopics.length === 0 && !draft.tripLookingOnly)}
            >
              All
            </button>
            {BROWSE_TRIP_TOPIC_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setDraft((p) => ({
                    ...p,
                    tripTopics: toggleBrowseTripTopicInList(p.tripTopics, key as BrowseTripTopicKey),
                    tripLookingOnly: false,
                  }))
                }
                className={listChipClass(draft.tripTopics.includes(key as BrowseTripTopicKey))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <SegmentRow label="Price" options={BROWSE_PRICE_OPTIONS} value={draft.price} onChange={(price: BrowsePriceFilter) => setDraft((p) => ({ ...p, price }))} />
        <SegmentRow
          label="Outing dates"
          options={EXPLORE_ACTIVITY_DATE_PRESET_OPTIONS.map((option) => ({
            key: option.value,
            label: option.label,
          }))}
          value={draft.activityDatePreset}
          onChange={(preset: ExploreActivityDatePreset) =>
            setDraft((p) => ({ ...p, activityDatePreset: preset }))
          }
        />
        <SegmentRow
          label="Weekend"
          options={BROWSE_WHEN_OPTIONS.filter((option) => option.key === 'any' || option.key === 'weekend')}
          value={draft.when}
          onChange={(when: BrowseWhenFilter) => setDraft((p) => ({ ...p, when }))}
        />

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
      </div>
    </ConsumerBottomSheet>
  );
};
