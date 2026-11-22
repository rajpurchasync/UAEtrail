import { Check } from 'lucide-react';
import { ConsumerBottomSheet } from '../../components/mobile/ConsumerBottomSheet';
import { useExploreRegionPillOptions } from '../../config/useExploreRegionPillOptions';
import { LIST_BROWSE_DATE_FILTER_OPTIONS } from '../../list/browse/listBrowseFilterModal';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import { EXPLORE_BOOKING_SEARCH_PICK_SHEET_Z } from '../../config/exploreTheme';

type ExploreSearchWhereSuggestSheetProps = {
  open: boolean;
  draftQuery: string;
  onClose: () => void;
  onSelect: (query: string) => void;
};

const normalize = (value: string) => value.trim().toLowerCase();

export const ExploreSearchWhereSuggestSheet = ({
  open,
  draftQuery,
  onClose,
  onSelect,
}: ExploreSearchWhereSuggestSheetProps) => {
  const emirateOptions = useExploreRegionPillOptions('AE');
  const activeNorm = normalize(draftQuery);

  return (
    <ConsumerBottomSheet
      open={open}
      title="Where"
      subtitle="Pick an area or keep typing in the search box."
      onClose={onClose}
      zIndex={EXPLORE_BOOKING_SEARCH_PICK_SHEET_Z}
    >
      <ul className="divide-y divide-neutral-100">
        {emirateOptions.map((item) => {
          const queryForSearch = item.key === 'all' ? '' : item.label;
          const active =
            item.key === 'all'
              ? activeNorm === ''
              : activeNorm === normalize(item.label) || activeNorm === normalize(item.key);
          return (
            <li key={item.key}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-[15px] font-medium text-neutral-900 active:bg-neutral-50"
                onClick={() => {
                  onSelect(queryForSearch);
                  onClose();
                }}
              >
                <span>{item.label}</span>
                {active ? <Check className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden /> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </ConsumerBottomSheet>
  );
};

type ExploreSearchWhenPickSheetProps = {
  open: boolean;
  activityDatePreset: ExploreActivityDatePreset;
  onClose: () => void;
  onSelect: (preset: ExploreActivityDatePreset) => void;
};

type ExploreSearchStatePickSheetProps = {
  open: boolean;
  venueRegions: string[];
  onClose: () => void;
  onSelect: (regions: string[]) => void;
};

/** Emirate / state — same options as list venue region filters. */
export const ExploreSearchStatePickSheet = ({
  open,
  venueRegions,
  onClose,
  onSelect,
}: ExploreSearchStatePickSheetProps) => {
  const emirateOptions = useExploreRegionPillOptions('AE');
  const activeKey = venueRegions.length === 1 ? venueRegions[0] : venueRegions.length === 0 ? 'all' : null;

  return (
    <ConsumerBottomSheet
      open={open}
      title="State"
      subtitle="Filter trails and spots by emirate"
      onClose={onClose}
      zIndex={EXPLORE_BOOKING_SEARCH_PICK_SHEET_Z}
    >
      <ul className="divide-y divide-neutral-100">
        {emirateOptions.map((item) => {
          const active =
            item.key === 'all' ? activeKey === 'all' : activeKey != null && activeKey === item.key;
          return (
            <li key={item.key}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-[15px] font-medium text-neutral-900 active:bg-neutral-50"
                onClick={() => {
                  onSelect(item.key === 'all' ? [] : [item.key]);
                  onClose();
                }}
              >
                <span>{item.label}</span>
                {active ? <Check className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden /> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </ConsumerBottomSheet>
  );
};

/** Same options as list browse filter modal (`LIST_BROWSE_DATE_FILTER_OPTIONS`). */
export const ExploreSearchWhenPickSheet = ({
  open,
  activityDatePreset,
  onClose,
  onSelect,
}: ExploreSearchWhenPickSheetProps) => (
  <ConsumerBottomSheet
    open={open}
    title="When"
    subtitle="Same date list as list and map browse"
    onClose={onClose}
    zIndex={EXPLORE_BOOKING_SEARCH_PICK_SHEET_Z}
  >
    <ul className="divide-y divide-neutral-100">
      {LIST_BROWSE_DATE_FILTER_OPTIONS.map(({ value, label }) => {
        const active = activityDatePreset === value;
        return (
          <li key={value}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-[15px] font-medium text-neutral-900 active:bg-neutral-50"
              onClick={() => {
                onSelect(value);
                onClose();
              }}
            >
              <span>{label}</span>
              {active ? <Check className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden /> : null}
            </button>
          </li>
        );
      })}
    </ul>
  </ConsumerBottomSheet>
);