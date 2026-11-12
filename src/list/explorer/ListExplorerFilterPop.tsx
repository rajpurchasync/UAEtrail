import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  EXPLORE_FACILITY_PILL_OPTIONS,
  aliasListPlaceTopicToMap,
  aliasPlaceMapTopicToList,
  clearExploreDestinationPlaceTopics,
  clearExploreFacilityPill,
  destinationPlaceTopicsFrom,
  exploreFacilityPillSelectedKeys,
  toggleExploreDestinationPlaceTopic,
  toggleExploreFacilityPillKey,
  type ExploreFacilityPillKey,
} from '../../explore/exploreOptionalFilters';
import { listVenuePlaceTopicsForUi } from '../listVenuePlaceTopics';
import type { PlaceMapTopicKey } from '../../explore/exploreMapQuickTopicFilters';

const mapPlaceTopics = (topics: readonly string[]): PlaceMapTopicKey[] =>
  topics.map(aliasListPlaceTopicToMap).filter((key): key is PlaceMapTopicKey => key != null);
import { LIST_FILTER_POP, LIST_OVERLAY_Z, listFilterPopChipClass, listFilterPopGridChipClass } from '../listChromeTheme';
import type { ListExplorerBucket } from './listExplorerBucket';
import type { ListFilterFabCorner } from './listExplorerFabSnap';

export type ListFilterPopPlacement = ListFilterFabCorner | 'below-end';

export type ListFilterPopFixedLayout = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

type ListExplorerFilterPopProps = {
  open: boolean;
  corner: ListFilterPopPlacement;
  bucket: ListExplorerBucket;
  applied: BrowseListFilterState;
  regions: string[];
  onApply: (state: BrowseListFilterState, regions: string[]) => void;
  onClose: () => void;
  /** Portaled fixed menu below an inline trigger (escapes header stacking). */
  fixedLayout?: ListFilterPopFixedLayout | null;
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
  <div className={LIST_FILTER_POP.block}>
    <p className={LIST_FILTER_POP.label}>{label}</p>
    <div className={LIST_FILTER_POP.chipRow}>
      {options.map(({ key, label: optionLabel }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={listFilterPopChipClass(value === key)}
        >
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
    ? { ...state, placeTopics: [], hasTrip: false, facilityKinds: [] }
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
  fixedLayout = null,
}: ListExplorerFilterPopProps) => {
  const [draft, setDraft] = useState(applied);
  const [draftRegions, setDraftRegions] = useState(regions);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDraft(applied);
      setDraftRegions(regions);
    }
    wasOpenRef.current = open;
  }, [open, applied, regions]);

  if (!open) return null;

  const origin =
    corner === 'below-end'
      ? 'top-full right-0 mt-1.5 max-h-[min(70dvh,calc(100dvh-var(--safe-top)-12rem))] overflow-y-auto'
      : corner === 'tl'
        ? 'top-14 left-0 md:top-11'
        : corner === 'tr'
          ? 'top-14 right-0 md:top-11'
          : corner === 'bl'
            ? 'bottom-14 left-0 md:bottom-11'
            : 'bottom-14 right-0 md:bottom-11';

  const zClass = corner === 'below-end' ? LIST_OVERLAY_Z : 'z-[20]';

  const panel = (
    <div className={`${EXPLORE_SHAPE.control} ${LIST_FILTER_POP.panel}`}>
        <div className={LIST_FILTER_POP.headerRow}>
          <p className={LIST_FILTER_POP.title}>Filters</p>
          <button
            type="button"
            onClick={() => {
              const next = resetVisibleFilters(draft, bucket);
              const nextRegions: string[] = [];
              onApply(next, nextRegions);
              setDraft(next);
              setDraftRegions(nextRegions);
            }}
            className={LIST_FILTER_POP.reset}
          >
            Reset
          </button>
        </div>
        <div className={LIST_FILTER_POP.sections}>
          {bucket === 'places' ? (
            <>
            <div className={LIST_FILTER_POP.block}>
              <p className={LIST_FILTER_POP.label}>Kinds</p>
              <div className={LIST_FILTER_POP.chipRow}>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      placeTopics: clearExploreDestinationPlaceTopics(mapPlaceTopics(prev.placeTopics)).map(
                        aliasPlaceMapTopicToList
                      ),
                    }))
                  }
                  className={listFilterPopChipClass(
                    destinationPlaceTopicsFrom(mapPlaceTopics(draft.placeTopics)).length === 0
                  )}
                >
                  All
                </button>
                {listVenuePlaceTopicsForUi().map(({ key, label }) => {
                  const selected = destinationPlaceTopicsFrom(mapPlaceTopics(draft.placeTopics)).includes(
                    aliasListPlaceTopicToMap(key) as PlaceMapTopicKey
                  );
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          placeTopics: toggleExploreDestinationPlaceTopic(
                            mapPlaceTopics(prev.placeTopics),
                            aliasListPlaceTopicToMap(key) as PlaceMapTopicKey
                          ).map(aliasPlaceMapTopicToList),
                        }))
                      }
                      className={listFilterPopChipClass(selected)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={LIST_FILTER_POP.block}>
              <p className={LIST_FILTER_POP.label}>By facilities</p>
              <div className={LIST_FILTER_POP.chipRow}>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => {
                      const cleared = clearExploreFacilityPill(mapPlaceTopics(prev.placeTopics));
                      return {
                        ...prev,
                        placeTopics: cleared.placeTopics.map(aliasPlaceMapTopicToList),
                        facilityKinds: cleared.facilityKinds,
                      };
                    })
                  }
                  className={listFilterPopChipClass(
                    exploreFacilityPillSelectedKeys(mapPlaceTopics(draft.placeTopics), draft.facilityKinds)
                      .length === 0
                  )}
                >
                  All
                </button>
                {EXPLORE_FACILITY_PILL_OPTIONS.map(({ key, label }) => {
                  const selected = exploreFacilityPillSelectedKeys(
                    mapPlaceTopics(draft.placeTopics),
                    draft.facilityKinds
                  ).includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => {
                          const next = toggleExploreFacilityPillKey(
                            mapPlaceTopics(prev.placeTopics),
                            prev.facilityKinds,
                            key as ExploreFacilityPillKey
                          );
                          return {
                            ...prev,
                            placeTopics: next.placeTopics.map(aliasPlaceMapTopicToList),
                            facilityKinds: next.facilityKinds,
                          };
                        })
                      }
                      className={listFilterPopChipClass(selected)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            </>
          ) : (
            <>
              <div className={LIST_FILTER_POP.block}>
                <p className={LIST_FILTER_POP.label}>Type</p>
                <div className={LIST_FILTER_POP.chipRow}>
                  <button
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, tripTopics: [], tripLookingOnly: false }))}
                    className={listFilterPopChipClass(draft.tripTopics.length === 0 && !draft.tripLookingOnly)}
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
                      className={listFilterPopChipClass(draft.tripTopics.includes(key as BrowseTripTopicKey))}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({ ...prev, tripLookingOnly: !prev.tripLookingOnly, tripTopics: [] }))
                    }
                    className={listFilterPopChipClass(draft.tripLookingOnly)}
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
          <div className={LIST_FILTER_POP.block}>
            <p className={LIST_FILTER_POP.label}>Area</p>
            <div className={LIST_FILTER_POP.areaGrid}>
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
                    className={listFilterPopGridChipClass(checked)}
                    aria-pressed={checked}
                    title={option.label}
                  >
                    <span className="block w-full truncate text-center">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className={LIST_FILTER_POP.footer}>
          <button
            type="button"
            onClick={onClose}
            className={`${LIST_FILTER_POP.footerBtn} border border-neutral-200 text-neutral-700`}
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft, draftRegions);
              onClose();
            }}
            className={`${LIST_FILTER_POP.footerBtn} font-bold ${EXPLORE_BRAND_ACTIVE}`}
          >
            Apply
          </button>
        </div>
      </div>
  );

  if (fixedLayout) {
    return createPortal(
      <div
        id="list-explorer-filter-menu"
        role="dialog"
        aria-label="Filters"
        className={`fixed ${LIST_OVERLAY_Z} overflow-y-auto overscroll-contain scroll-touch ${LIST_FILTER_POP.shell}`}
        style={{
          top: fixedLayout.top,
          left: fixedLayout.left,
          width: fixedLayout.width,
          maxHeight: fixedLayout.maxHeight,
        }}
      >
        {panel}
      </div>,
      document.body
    );
  }

  return (
    <div
      className={`absolute ${zClass} ${LIST_FILTER_POP.shell} ${origin}`}
      role="dialog"
      aria-label="Filters"
    >
      {panel}
    </div>
  );
};
