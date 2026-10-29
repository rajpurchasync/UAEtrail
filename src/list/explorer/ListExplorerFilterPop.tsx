import { useEffect, useState } from 'react';
import { EXPLORE_BRAND_ACTIVE, EXPLORE_SHAPE } from '../../config/exploreTheme';
import { getVenueStateFilterOptions } from '../../config/regions';
import {
  EXPLORE_ACTIVITY_DATE_PRESET_OPTIONS,
  type ExploreActivityDatePreset,
} from '../../explore/exploreActivityDateFilter';
import {
  BROWSE_PRICE_OPTIONS,
  BROWSE_WHEN_OPTIONS,
  type BrowseListFilterState,
  type BrowsePriceFilter,
  type BrowseWhenFilter,
} from '../browseListFilters';
import {
  BROWSE_TRIP_TOPIC_FILTERS,
  toggleBrowseTripTopicInList,
  type BrowseTripTopicKey,
} from '../browseListTripTopics';
import {
  listVenuePlaceTopicsForUi,
  toggleListVenuePlaceTopic,
  type ListVenuePlaceTopicKey,
} from '../listVenuePlaceTopics';
import { listChipClass } from '../listChromeTheme';
import type { ListExplorerBucket } from './listExplorerBucket';

type ListExplorerFilterPopProps = {
  open: boolean;
  corner: 'tl' | 'tr' | 'bl' | 'br';
  bucket: ListExplorerBucket;
  applied: BrowseListFilterState;
  regions: string[];
  onApply: (state: BrowseListFilterState, regions: string[]) => void;
  onClose: () => void;
};

const ChipRow = <T extends string>({
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
  <div className="space-y-1.5">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
    <div className="flex flex-wrap gap-1.5">
      {options.map(({ key, label: optionLabel }) => (
        <button key={key} type="button" onClick={() => onChange(key)} className={listChipClass(value === key)}>
          {optionLabel}
        </button>
      ))}
    </div>
  </div>
);

const resetVisibleFilters = (
  state: BrowseListFilterState,
  bucket: ListExplorerBucket
): BrowseListFilterState =>
  bucket === 'places'
    ? { ...state, placeTopics: [] }
    : {
        ...state,
        tripTopics: [],
        tripLookingOnly: false,
        price: 'all',
        when: 'any',
        activityDatePreset: 'anyday',
      };

export const ListExplorerFilterPop = ({
  open,
  corner,
  bucket,
  applied,
  regions,
  onApply,
  onClose,
}: ListExplorerFilterPopProps) => {
  const [draft, setDraft] = useState(applied);
  const [draftRegions, setDraftRegions] = useState(regions);

  useEffect(() => {
    if (open) {
      setDraft(applied);
      setDraftRegions(regions);
    }
  }, [open, applied, regions]);

  if (!open) return null;

  const origin =
    corner === 'tl'
      ? 'top-14 left-0'
      : corner === 'tr'
        ? 'top-14 right-0'
        : corner === 'bl'
          ? 'bottom-14 left-0'
          : 'bottom-14 right-0';

  return (
    <div
      className={`absolute z-[20] w-[min(20.5rem,calc(100vw-2rem))] ${origin}`}
      role="dialog"
      aria-label="Filters"
    >
      <div
        className={`${EXPLORE_SHAPE.control} max-h-[min(70vh,32rem)] overflow-y-auto border border-neutral-200/90 bg-white p-3.5 shadow-[0_12px_40px_rgba(15,23,42,.18)]`}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-neutral-900">Filters</p>
          <button
            type="button"
            onClick={() => {
              setDraft(resetVisibleFilters(draft, bucket));
              setDraftRegions([]);
            }}
            className="text-sm font-semibold text-emerald-700"
          >
            Reset
          </button>
        </div>
        <div className="space-y-4">
          {bucket === 'places' ? (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Type</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, placeTopics: [] }))}
                  className={listChipClass(draft.placeTopics.length === 0)}
                >
                  All
                </button>
                {listVenuePlaceTopicsForUi().map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        placeTopics: toggleListVenuePlaceTopic(prev.placeTopics, key as ListVenuePlaceTopicKey),
                      }))
                    }
                    className={listChipClass(draft.placeTopics.includes(key as ListVenuePlaceTopicKey))}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Type</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, tripTopics: [], tripLookingOnly: false }))}
                    className={listChipClass(draft.tripTopics.length === 0 && !draft.tripLookingOnly)}
                  >
                    All
                  </button>
                  {BROWSE_TRIP_TOPIC_FILTERS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          tripTopics: toggleBrowseTripTopicInList(prev.tripTopics, key as BrowseTripTopicKey),
                          tripLookingOnly: false,
                        }))
                      }
                      className={listChipClass(draft.tripTopics.includes(key as BrowseTripTopicKey))}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({ ...prev, tripLookingOnly: !prev.tripLookingOnly, tripTopics: [] }))
                    }
                    className={listChipClass(draft.tripLookingOnly)}
                  >
                    Looking for
                  </button>
                </div>
              </div>
              <ChipRow
                label="When"
                options={EXPLORE_ACTIVITY_DATE_PRESET_OPTIONS.map((option) => ({
                  key: option.value,
                  label: option.label,
                }))}
                value={draft.activityDatePreset}
                onChange={(preset: ExploreActivityDatePreset) =>
                  setDraft((prev) => ({ ...prev, activityDatePreset: preset }))
                }
              />
              <ChipRow
                label="Weekend"
                options={BROWSE_WHEN_OPTIONS.filter((option) => option.key === 'any' || option.key === 'weekend')}
                value={draft.when}
                onChange={(when: BrowseWhenFilter) => setDraft((prev) => ({ ...prev, when }))}
              />
              <ChipRow
                label="Price"
                options={BROWSE_PRICE_OPTIONS}
                value={draft.price}
                onChange={(price: BrowsePriceFilter) => setDraft((prev) => ({ ...prev, price }))}
              />
            </>
          )}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Area</p>
            <div className="grid grid-cols-2 gap-1">
              {getVenueStateFilterOptions().map((option) => {
                const checked = draftRegions.includes(option.key);
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() =>
                      setDraftRegions((prev) =>
                        prev.includes(option.key)
                          ? prev.filter((region) => region !== option.key)
                          : [...prev, option.key]
                      )
                    }
                    className={listChipClass(checked)}
                    aria-pressed={checked}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-2xl border border-neutral-200 text-sm font-semibold text-neutral-700"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft, draftRegions);
              onClose();
            }}
            className={`min-h-11 flex-1 rounded-2xl text-sm font-bold ${EXPLORE_BRAND_ACTIVE}`}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
