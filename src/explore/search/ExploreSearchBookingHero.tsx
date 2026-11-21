import { useState } from 'react';
import { CalendarDays, MapPinned, Search } from 'lucide-react';
import { exploreSearchWhenSummary } from './exploreSearchWhenLabel';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import {
  EXPLORE_SEARCH_CTA,
  EXPLORE_SEARCH_WHERE_PLACEHOLDER,
} from './exploreSearchHomeCopy';
import {
  ExploreSearchStatePickSheet,
  ExploreSearchWhenPickSheet,
  ExploreSearchWhereSuggestSheet,
} from './ExploreSearchPickSheets';
import type { ExploreSearchScope } from './exploreSearchRouting';
import { exploreSearchStateSummary } from './exploreSearchVenueState';
import { useExploreRegionPillOptions } from '../../config/useExploreRegionPillOptions';
import { formatExploreSearchWhereDisplay } from './exploreSearchWhereDisplay';
import { ExploreSearchWhereDropdown } from './ExploreSearchWhereDropdown';
import { useExploreSearchWhereSuggestions } from './useExploreSearchWhereSuggestions';

const SEARCH_BOOKING_ROW =
  'flex min-h-[52px] w-full items-center gap-3 border-b border-neutral-200 px-3 py-3 text-left';

type ExploreSearchBookingHeroProps = {
  homeScope: ExploreSearchScope;
  detectedWhere: string;
  committedWhere: string;
  draftQuery: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  activityDatePreset: ExploreActivityDatePreset;
  onDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  venueRegions: string[];
  onVenueRegionsChange: (regions: string[]) => void;
};

/** Booking-style single framed block — stacked rows, no extra labels or inner boxes. */
export const ExploreSearchBookingHero = ({
  homeScope,
  detectedWhere,
  committedWhere,
  draftQuery,
  onQueryChange,
  onSubmit,
  activityDatePreset,
  onDatePresetChange,
  venueRegions,
  onVenueRegionsChange,
}: ExploreSearchBookingHeroProps) => {
  const regionPillOptions = useExploreRegionPillOptions('AE');
  const placesScope = homeScope === 'places';
  const [whenSheetOpen, setWhenSheetOpen] = useState(false);
  const [stateSheetOpen, setStateSheetOpen] = useState(false);
  const [whereSheetOpen, setWhereSheetOpen] = useState(false);
  const [whereFocused, setWhereFocused] = useState(false);
  const [whereEdited, setWhereEdited] = useState(false);
  const [whereSuggestOpen, setWhereSuggestOpen] = useState(false);

  const suggestQuery = whereFocused ? draftQuery : '';
  const suggestions = useExploreSearchWhereSuggestions(suggestQuery, whereFocused && whereSuggestOpen);
  const showSuggestPanel = whereFocused && whereSuggestOpen && suggestQuery.trim().length > 0;

  const restingWhere = formatExploreSearchWhereDisplay(draftQuery.trim() || committedWhere || detectedWhere);

  const handleWhereFocus = () => {
    setWhereFocused(true);
    setWhereSheetOpen(false);
    const pristine = !whereEdited && draftQuery.trim() === committedWhere.trim();
    if (pristine) {
      onQueryChange('');
    }
    setWhereSuggestOpen(true);
  };

  const handleWhereBlur = () => {
    setWhereFocused(false);
    setWhereSuggestOpen(false);
    if (!draftQuery.trim()) {
      onQueryChange(committedWhere || detectedWhere);
      setWhereEdited(false);
    }
  };

  const handleWhereChange = (value: string) => {
    setWhereEdited(true);
    onQueryChange(value);
    setWhereSuggestOpen(value.trim().length > 0);
  };

  const handleWherePick = (value: string) => {
    setWhereEdited(true);
    onQueryChange(value);
    setWhereSuggestOpen(false);
  };

  const handleWhereSheetSelect = (value: string) => {
    setWhereEdited(true);
    onQueryChange(value);
  };

  return (
    <>
      <div className="relative z-30">
        <div className="rounded-lg border-2 border-emerald-300 bg-white">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <label className={`${SEARCH_BOOKING_ROW} cursor-text focus-within:bg-neutral-50/80`}>
              <Search className="h-[22px] w-[22px] shrink-0 text-neutral-800" strokeWidth={2.25} aria-hidden />
              <input
                type="search"
                enterKeyHint="search"
                value={whereFocused ? draftQuery : restingWhere}
                onChange={(event) => handleWhereChange(event.target.value)}
                onFocus={handleWhereFocus}
                onBlur={handleWhereBlur}
                placeholder={whereFocused ? EXPLORE_SEARCH_WHERE_PLACEHOLDER : undefined}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                aria-expanded={showSuggestPanel}
                aria-haspopup="listbox"
                className="min-w-0 flex-1 border-0 bg-transparent py-0 text-[15px] font-medium leading-snug text-neutral-900 placeholder:font-normal placeholder:text-neutral-500 focus:outline-none focus:ring-0"
              />
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setWhereSheetOpen(true);
                }}
                className="shrink-0 text-xs font-medium text-neutral-500"
                aria-label="Change where"
              >
                Change
              </button>
            </label>

            {placesScope ? (
              <button
                type="button"
                onClick={() => setStateSheetOpen(true)}
                className={`${SEARCH_BOOKING_ROW} active:bg-neutral-50`}
                aria-expanded={stateSheetOpen}
                aria-haspopup="dialog"
              >
                <MapPinned className="h-[22px] w-[22px] shrink-0 text-neutral-800" strokeWidth={2.25} aria-hidden />
                <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-neutral-900">
                  {exploreSearchStateSummary(venueRegions, regionPillOptions)}
                </span>
                <span className="shrink-0 text-xs font-medium text-neutral-500">Change</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setWhenSheetOpen(true)}
                className={`${SEARCH_BOOKING_ROW} active:bg-neutral-50`}
                aria-expanded={whenSheetOpen}
                aria-haspopup="dialog"
              >
                <CalendarDays className="h-[22px] w-[22px] shrink-0 text-neutral-800" strokeWidth={2.25} aria-hidden />
                <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-neutral-900">
                  {exploreSearchWhenSummary(activityDatePreset)}
                </span>
                <span className="shrink-0 text-xs font-medium text-neutral-500">Change</span>
              </button>
            )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 bg-emerald-600 py-3.5 text-[17px] font-bold text-white active:bg-emerald-700"
          >
            {EXPLORE_SEARCH_CTA}
          </button>
          </form>
        </div>

        <ExploreSearchWhereDropdown
          open={showSuggestPanel}
          suggestions={suggestions}
          onPick={handleWherePick}
        />
      </div>

      <ExploreSearchWhereSuggestSheet
        open={whereSheetOpen}
        draftQuery={draftQuery.trim() || committedWhere}
        onClose={() => setWhereSheetOpen(false)}
        onSelect={handleWhereSheetSelect}
      />
      <ExploreSearchStatePickSheet
        open={stateSheetOpen}
        venueRegions={venueRegions}
        onClose={() => setStateSheetOpen(false)}
        onSelect={onVenueRegionsChange}
      />
      <ExploreSearchWhenPickSheet
        open={whenSheetOpen}
        activityDatePreset={activityDatePreset}
        onClose={() => setWhenSheetOpen(false)}
        onSelect={onDatePresetChange}
      />
    </>
  );
};