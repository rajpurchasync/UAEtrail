import { useEffect, useMemo, useRef, useState } from 'react';
import { EXPLORE_BRAND_ACTIVE, EXPLORE_SHAPE } from '../../config/exploreTheme';
import { getVenueStateFilterOptions } from '../../config/regions';
import {
  EXPLORE_ACTIVITY_DATE_PRESET_OPTIONS,
  type ExploreActivityDatePreset,
} from '../../explore/exploreActivityDateFilter';
import { geoStore } from '../../geo/geoStore';
import { useGeoStoreReady } from '../../geo/useGeoStoreReady';
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
import { toggleListVenuePlaceTopic, type ListVenuePlaceTopicKey } from '../listVenuePlaceTopics';
import {
  BROWSE_GEO_LEAF_PLACE_TYPES,
  browseGeoChildKindLabel,
  browseGeoPathLabels,
  findGeoStateNodeForRegionKey,
  formatBrowseGeoPathLabel,
  regionsFromBrowseGeoPath,
  resolveBrowseGeoNode,
} from '../browseGeoPath';
import { LIST_FILTER_POP, listFilterPopChipClass, listFilterPopGridChipClass } from '../listChromeTheme';
import type { ListExplorerBucket } from './listExplorerBucket';

type ListExplorerFilterPopProps = {
  open: boolean;
  corner: 'tl' | 'tr' | 'bl' | 'br';
  bucket: ListExplorerBucket;
  applied: BrowseListFilterState;
  regions: string[];
  geoIds?: string[];
  lockGeoIds?: string[];
  lockGeoKind?: 'country' | 'state' | 'area' | 'venue' | null;
  onApply: (state: BrowseListFilterState, regions: string[], geoIds: string[]) => void;
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
  geoIds = [],
  lockGeoIds = [],
  lockGeoKind = null,
  onApply,
  onClose,
}: ListExplorerFilterPopProps) => {
  const geoVersion = useGeoStoreReady();
  const [draft, setDraft] = useState(applied);
  const [draftRegions, setDraftRegions] = useState(regions);
  const [draftGeoIds, setDraftGeoIds] = useState(geoIds.length > 0 ? geoIds : lockGeoIds);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDraft(applied);
      setDraftRegions(regions);
      setDraftGeoIds(geoIds.length > 0 ? geoIds : lockGeoIds);
    }
    wasOpenRef.current = open;
  }, [open, applied, regions, geoIds, lockGeoIds]);

  const aeCountry = useMemo(() => {
    void geoVersion;
    return geoStore.countryByCode('AE');
  }, [geoVersion]);
  const leafId = draftGeoIds[draftGeoIds.length - 1];
  const leafNode = leafId ? resolveBrowseGeoNode(leafId) : null;
  const parentForChildren =
    leafNode ??
    (lockGeoIds[0] ? resolveBrowseGeoNode(lockGeoIds[0]!) : null) ??
    aeCountry;
  const childNodes = parentForChildren ? geoStore.childrenOf(parentForChildren.id) : [];
  const hideEmirates =
    lockGeoKind === 'state' ||
    lockGeoKind === 'area' ||
    lockGeoKind === 'venue' ||
    leafNode?.kind === 'state' ||
    leafNode?.kind === 'area' ||
    leafNode?.kind === 'venue' ||
    parentForChildren?.kind === 'state' ||
    parentForChildren?.kind === 'area' ||
    parentForChildren?.kind === 'venue';
  const showChildGrid = Boolean(parentForChildren) && childNodes.length > 0 && parentForChildren?.kind !== 'venue';
  const showEmiratesFallback = !hideEmirates && !showChildGrid;
  const atGeoLeaf =
    leafNode?.kind === 'venue' || (leafNode?.kind === 'area' && childNodes.length === 0);
  const showPlaceTypes = bucket === 'places' && atGeoLeaf;
  const pathLabel = formatBrowseGeoPathLabel(draftGeoIds);
  const crumbLabels = browseGeoPathLabels(draftGeoIds);

  const commitGeo = (nextIds: string[], nextDraft = draft) => {
    const nextRegions = regionsFromBrowseGeoPath(nextIds);
    setDraftGeoIds(nextIds);
    setDraftRegions(nextRegions);
    onApply(nextDraft, nextRegions, nextIds);
  };

  if (!open) return null;

  const origin =
    corner === 'tl'
      ? 'top-14 left-0 md:top-11'
      : corner === 'tr'
        ? 'top-14 right-0 md:top-11'
        : corner === 'bl'
          ? 'bottom-14 left-0 md:bottom-11'
          : 'bottom-14 right-0 md:bottom-11';

  return (
    <div
      className={`absolute z-[20] ${LIST_FILTER_POP.shell} ${origin}`}
      role="dialog"
      aria-label="Filters"
    >
      <div className={`${EXPLORE_SHAPE.control} ${LIST_FILTER_POP.panel}`}>
        <div className={LIST_FILTER_POP.headerRow}>
          <p className={LIST_FILTER_POP.title}>{pathLabel ?? 'Filters'}</p>
          <button
            type="button"
            onClick={() => {
              const next = resetVisibleFilters(draft, bucket);
              commitGeo([...lockGeoIds], next);
              setDraft(next);
            }}
            className={LIST_FILTER_POP.reset}
          >
            Reset
          </button>
        </div>
        <div className={LIST_FILTER_POP.sections}>
          {bucket === 'places' ? (
            showPlaceTypes ? (
              <div className={LIST_FILTER_POP.block}>
                <p className={LIST_FILTER_POP.label}>Type</p>
                <div className={LIST_FILTER_POP.chipRow}>
                  <button
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, placeTopics: [] }))}
                    className={listFilterPopChipClass(draft.placeTopics.length === 0)}
                  >
                    All
                  </button>
                  {BROWSE_GEO_LEAF_PLACE_TYPES.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          placeTopics: toggleListVenuePlaceTopic(prev.placeTopics, key as ListVenuePlaceTopicKey),
                        }))
                      }
                      className={listFilterPopChipClass(draft.placeTopics.includes(key as ListVenuePlaceTopicKey))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null
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
            {crumbLabels.length > 0 ? (
              <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 pb-0.5">
                {crumbLabels.map((label, index) => {
                  const locked = index < browseGeoPathLabels(lockGeoIds).length;
                  return (
                    <span key={`${label}-${index}`} className="flex min-w-0 items-center gap-1">
                      {index > 0 ? (
                        <span className="text-[10px] text-neutral-400" aria-hidden>
                          →
                        </span>
                      ) : null}
                      <button
                        type="button"
                        disabled={locked && index === crumbLabels.length - 1}
                        onClick={() => {
                          const visibleStart = draftGeoIds.findIndex((id) => {
                            const node = resolveBrowseGeoNode(id);
                            return Boolean(node && node.kind !== 'country');
                          });
                          const absoluteIndex = (visibleStart < 0 ? 0 : visibleStart) + index;
                          const next = draftGeoIds.slice(0, Math.max(lockGeoIds.length, absoluteIndex + 1));
                          commitGeo(next);
                        }}
                        className="truncate text-[11px] font-semibold text-emerald-800"
                      >
                        {label}
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : null}
            {showChildGrid ? (
              <>
                <p className={LIST_FILTER_POP.label}>
                  {browseGeoChildKindLabel(parentForChildren?.kind)}
                </p>
                <div className={LIST_FILTER_POP.areaGrid}>
                  {childNodes.map((node) => {
                    const checked = draftGeoIds.includes(node.id);
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => {
                          if (checked) {
                            const parentId = parentForChildren?.id;
                            const parentIndex = parentId ? draftGeoIds.lastIndexOf(parentId) : -1;
                            commitGeo(parentIndex >= 0 ? draftGeoIds.slice(0, parentIndex + 1) : [...lockGeoIds]);
                            return;
                          }
                          const parentId = parentForChildren?.id;
                          const parentIndex = parentId ? draftGeoIds.lastIndexOf(parentId) : -1;
                          const prefix =
                            parentIndex >= 0 ? draftGeoIds.slice(0, parentIndex + 1) : [...lockGeoIds];
                          commitGeo([...prefix, node.id]);
                        }}
                        className={listFilterPopGridChipClass(checked)}
                        aria-pressed={checked}
                        title={node.n}
                      >
                        <span className="block w-full truncate text-center">{node.n}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}
            {showEmiratesFallback ? (
              <>
                <p className={LIST_FILTER_POP.label}>Emirates</p>
                <div className={LIST_FILTER_POP.areaGrid}>
                  {getVenueStateFilterOptions().map((option) => {
                    const node = findGeoStateNodeForRegionKey(option.key);
                    const id = node?.id ?? option.key;
                    const checked = draftGeoIds.includes(id) || draftRegions.includes(option.key);
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => commitGeo(checked ? lockGeoIds : [...lockGeoIds, id])}
                        className={listFilterPopGridChipClass(checked)}
                        aria-pressed={checked}
                        title={option.label}
                      >
                        <span className="block w-full truncate text-center">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}
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
              onApply(draft, draftRegions, draftGeoIds);
              onClose();
            }}
            className={`${LIST_FILTER_POP.footerBtn} font-bold ${EXPLORE_BRAND_ACTIVE}`}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
