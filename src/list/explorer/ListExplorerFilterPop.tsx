import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { EXPLORE_BRAND_ACTIVE, EXPLORE_SHAPE } from '../../config/exploreTheme';
import {
  type BrowseAudienceFilter,
  type BrowseListFilterState,
  type BrowsePriceFilter,
} from '../browse/browseListFilters';
import { toggleBrowseTripTopicInList } from '../browse/browseListTripTopics';
import {
  aliasListPlaceTopicToMap,
  aliasPlaceMapTopicToList,
  destinationPlaceTopicsFrom,
  toggleExploreDestinationPlaceTopic,
} from '../../discovery/discoveryPortExploreOptionalFilterWire';
import type { PlaceMapTopicKey } from '../../discovery/discoveryPortExploreOptionalFilterWire';
import { LIST_FILTER_POP, LIST_OVERLAY_Z, listFilterPopChipClass } from '../browse/listChromeTheme';
import type { BrowseListBucket } from '../browse/browseListBucket';
import type { ListFilterFabCorner } from '../browse/listFilterFabSnap';
import {
  LIST_BROWSE_AUDIENCE_OPTIONS,
  LIST_BROWSE_DATE_FILTER_OPTIONS,
  LIST_BROWSE_PLACE_TYPE_OPTIONS,
  LIST_BROWSE_PRICE_MODAL_OPTIONS,
  LIST_BROWSE_TRIP_TYPE_OPTIONS,
} from '../browse/listBrowseFilterModal';

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
  bucket: BrowseListBucket;
  applied: BrowseListFilterState;
  regions: string[];
  onApply: (state: BrowseListFilterState, regions: string[]) => void;
  onClose: () => void;
  fixedLayout?: ListFilterPopFixedLayout | null;
};

const mapPlaceTopics = (topics: readonly string[]): PlaceMapTopicKey[] =>
  topics.map(aliasListPlaceTopicToMap).filter((key): key is PlaceMapTopicKey => key != null);

const FilterSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className={LIST_FILTER_POP.section}>
    <h3 className={LIST_FILTER_POP.label}>{title}</h3>
    {children}
  </section>
);

const ChipRow = ({
  children,
  grid,
}: {
  children: ReactNode;
  grid?: boolean;
}) => (
  <div className={grid ? LIST_FILTER_POP.chipGrid : LIST_FILTER_POP.chipRow}>{children}</div>
);

const resetVisibleFilters = (
  state: BrowseListFilterState,
  bucket: BrowseListBucket
): BrowseListFilterState =>
  bucket === 'places'
    ? { ...state, placeTopics: [], hasTrip: false, facilityKinds: [], audience: 'anyone' }
    : {
        ...state,
        tripTopics: [],
        tripAvailabilityOnly: false,
        price: 'all',
        when: 'any',
        activityDatePreset: 'anyday',
        audience: 'anyone',
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

  const placeTopicsMap = mapPlaceTopics(draft.placeTopics);
  const destinationTopics = destinationPlaceTopicsFrom(placeTopicsMap);

  const panel = (
    <div className={`${EXPLORE_SHAPE.control} ${LIST_FILTER_POP.panel}`}>
      <div className={LIST_FILTER_POP.headerRow}>
        <p className={LIST_FILTER_POP.title}>Filters</p>
        <button
          type="button"
          onClick={() => {
            const next = resetVisibleFilters(draft, bucket);
            onApply(next, draftRegions);
            setDraft(next);
          }}
          className={LIST_FILTER_POP.reset}
        >
          Reset
        </button>
      </div>
      <div className={LIST_FILTER_POP.sections}>
        {bucket === 'places' ? (
          <>
            <FilterSection title="Type">
              <ChipRow>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      placeTopics: [],
                    }))
                  }
                  className={listFilterPopChipClass(destinationTopics.length === 0)}
                >
                  All
                </button>
                {LIST_BROWSE_PLACE_TYPE_OPTIONS.map(({ key, label }) => {
                  const selected = destinationTopics.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          placeTopics: toggleExploreDestinationPlaceTopic(
                            mapPlaceTopics(prev.placeTopics),
                            key
                          ).map(aliasPlaceMapTopicToList),
                        }))
                      }
                      className={listFilterPopChipClass(selected)}
                    >
                      {label}
                    </button>
                  );
                })}
              </ChipRow>
            </FilterSection>
            <FilterSection title="Who can attend">
              <ChipRow>
                {LIST_BROWSE_AUDIENCE_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, audience: key }))}
                    className={listFilterPopChipClass(draft.audience === key)}
                  >
                    {label}
                  </button>
                ))}
              </ChipRow>
            </FilterSection>
          </>
        ) : (
          <>
            <FilterSection title="Type">
              <ChipRow>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, tripTopics: [], tripAvailabilityOnly: false }))
                  }
                  className={listFilterPopChipClass(draft.tripTopics.length === 0 && !draft.tripAvailabilityOnly)}
                >
                  All
                </button>
                {LIST_BROWSE_TRIP_TYPE_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        tripTopics: toggleBrowseTripTopicInList(prev.tripTopics, key),
                        tripAvailabilityOnly: false,
                      }))
                    }
                    className={listFilterPopChipClass(draft.tripTopics.includes(key))}
                  >
                    {label}
                  </button>
                ))}
              </ChipRow>
            </FilterSection>
            <FilterSection title="Date">
              <ChipRow grid>
                {LIST_BROWSE_DATE_FILTER_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        activityDatePreset: value,
                        when: 'any',
                      }))
                    }
                    className={listFilterPopChipClass(draft.activityDatePreset === value)}
                  >
                    {label}
                  </button>
                ))}
              </ChipRow>
            </FilterSection>
            <FilterSection title="Free / Paid">
              <ChipRow>
                {LIST_BROWSE_PRICE_MODAL_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, price: key as BrowsePriceFilter }))}
                    className={listFilterPopChipClass(draft.price === key)}
                  >
                    {label}
                  </button>
                ))}
              </ChipRow>
            </FilterSection>
            <FilterSection title="Who can attend">
              <ChipRow>
                {LIST_BROWSE_AUDIENCE_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({ ...prev, audience: key as BrowseAudienceFilter }))
                    }
                    className={listFilterPopChipClass(draft.audience === key)}
                  >
                    {label}
                  </button>
                ))}
              </ChipRow>
            </FilterSection>
          </>
        )}
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