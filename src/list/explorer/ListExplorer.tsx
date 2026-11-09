import { useMemo, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { EXPLORE_BRAND_ACTIVE } from '../../config/exploreTheme';
import { APP_SCROLL_BODY_CLASS } from '../../config/layoutScroll';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../../explore/exploreBrowseTaxonomy';
import { BROWSE_LIST_CLEAR_FILTERS, BROWSE_LIST_EMPTY } from '../browseListCopy';
import type { BrowseListFilterState } from '../browseListFilters';
import type { BrowseTripTopicKey } from '../browseListTripTopics';
import type { ListVenuePlaceTopicKey } from '../listVenuePlaceTopics';
import type { ExploreActivityDatePreset } from '../../explore/exploreActivityDateFilter';
import { ListExplorerCalendar } from './ListExplorerCalendar';
import { ListExplorerFilterFab } from './ListExplorerFilterFab';
import { ListExplorerHeader } from './ListExplorerHeader';
import { ListExplorerListRow } from './ListExplorerListRow';
import { ListExplorerThumbnailCard } from './ListExplorerThumbnailCard';
import { PlaceDistanceProvider } from './listPlaceDistance';
import { useViewerLocation } from './useViewerLocation';
import { useDisplayPreferences } from '../../preferences/useDisplayPreferences';
import type { ListExplorerBucket } from './listExplorerBucket';
import type { ListExplorerLayout } from './listExplorerLayout';
import type { ListExplorerDateSection } from './listExplorerDateSections';
import { ListGuestCatalogPreviewNotice } from '../ui/ListGuestCatalogPreviewNotice';
import {
  groupListExplorerSections,
  listExplorerSortShowsDistance,
  listExplorerSortUsesViewerLocation,
  sortListExplorerCards,
  type ListExplorerSortMode,
} from './listExplorerSort';

type ListExplorerProps = {
  cards: DiscoveryCardModel[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  onQuerySync: () => void;
  onSearchCommit: (scope?: ExploreSearchScopeKey | null) => void;
  onClearQuery: () => void;
  searchScopeCounts: ExploreSearchScopeCounts;
  mapHref: string;
  layout: ListExplorerLayout;
  onLayoutChange: (layout: ListExplorerLayout) => void;
  bucket: ListExplorerBucket;
  onBucketChange: (bucket: ListExplorerBucket) => void;
  filters: BrowseListFilterState;
  regions: string[];
  filterCount: number;
  onApplyFilters: (state: BrowseListFilterState, regions: string[]) => void;
  onClearFilters: () => void;
  onClose?: () => void;
  embedded?: boolean;
  mapColumnVisible?: boolean;
  showMapColumnPrompt?: boolean;
  onOpenMapColumn?: () => void;
  onMapHover?: (exploreItemId: string | null) => void;
  sort: ListExplorerSortMode;
  onSortChange: (mode: ListExplorerSortMode) => void;
  showGuestCatalogPreview?: boolean;
  listPanelWidthPx?: number;
  onToggleTripTopic: (key: BrowseTripTopicKey) => void;
  onTogglePlaceTopic: (key: ListVenuePlaceTopicKey) => void;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  onVenueRegionsChange: (regions: string[]) => void;
  /** Standalone `/list` on mobile — Trips/Venues use bottom nav instead of in-page toggle. */
  hideBucketToggleOnMobile?: boolean;
};

const thumbGridClass = (sideMap: boolean) =>
  `list-explorer-thumb-grid grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2 ${
    sideMap ? 'list-explorer-thumb-grid--side-map' : ''
  }`;

const LIST_VIRTUALIZE_MIN = 36;
const LIST_ROW_ESTIMATE_PX = 92;

const VirtualizedListRows = ({
  cards,
  onMapHover,
  showDistance,
  scrollElement,
}: {
  cards: DiscoveryCardModel[];
  onMapHover?: (exploreItemId: string | null) => void;
  showDistance?: boolean;
  scrollElement: HTMLElement | null;
}) => {
  const virtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => LIST_ROW_ESTIMATE_PX,
    overscan: 8,
  });

  return (
    <ul className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const card = cards[virtualRow.index]!;
        return (
          <li
            key={card.id}
            className="absolute left-0 top-0 w-full pb-2"
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          >
            <ListExplorerListRow card={card} onMapHover={onMapHover} showDistance={showDistance} />
          </li>
        );
      })}
    </ul>
  );
};

const ListExplorerDateGroups = ({
  sections,
  layout,
  onMapHover,
  compactThumbGrid = false,
  showDistance = false,
  scrollElement,
}: {
  sections: ListExplorerDateSection[];
  layout: ListExplorerLayout;
  onMapHover?: (exploreItemId: string | null) => void;
  compactThumbGrid?: boolean;
  showDistance?: boolean;
  scrollElement?: HTMLElement | null;
}) => {
  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <section key={section.key}>
          {section.label ? (
            <h2 className="mb-2 flex items-center gap-2.5 text-sm font-semibold text-neutral-800">
              <span className="h-0.5 w-8 shrink-0 rounded-full bg-emerald-600" aria-hidden />
              <span className="shrink-0">{section.label}</span>
              <span className="h-0.5 min-w-6 flex-1 rounded-full bg-neutral-200" aria-hidden />
            </h2>
          ) : null}
          {layout === 'list' ? (
            section.cards.length >= LIST_VIRTUALIZE_MIN && scrollElement ? (
              <VirtualizedListRows
                cards={section.cards}
                onMapHover={onMapHover}
                showDistance={showDistance}
                scrollElement={scrollElement}
              />
            ) : (
            <ul className="space-y-2">
              {section.cards.map((card) => (
                <li key={card.id}>
                  <ListExplorerListRow card={card} onMapHover={onMapHover} showDistance={showDistance} />
                </li>
              ))}
            </ul>
            )
          ) : (
            <ul className={thumbGridClass(compactThumbGrid)}>
              {section.cards.map((card) => (
                <li key={card.id} className="min-w-0">
                  <ListExplorerThumbnailCard card={card} onMapHover={onMapHover} showDistance={showDistance} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
};

const ThumbnailSkeleton = ({ compactThumbGrid = false }: { compactThumbGrid?: boolean }) => (
  <div className={thumbGridClass(compactThumbGrid)} aria-hidden>
    {Array.from({ length: 6 }, (_, index) => (
      <div key={index} className="overflow-hidden rounded-2xl bg-neutral-200">
        <div className="h-[9.75rem] animate-pulse bg-neutral-300/80 sm:h-[8.75rem] md:h-32" />
        <div className="space-y-1 p-2">
          <div className="h-2.5 w-4/5 animate-pulse rounded bg-neutral-300/80" />
          <div className="h-3 w-full animate-pulse rounded bg-neutral-300/70" />
        </div>
      </div>
    ))}
  </div>
);

export const ListExplorer = ({
  cards,
  loading,
  error,
  onRetry,
  query,
  onQueryChange,
  onQuerySync,
  onSearchCommit,
  onClearQuery,
  searchScopeCounts,
  mapHref,
  layout,
  onLayoutChange,
  bucket,
  onBucketChange,
  filters,
  regions,
  filterCount,
  onApplyFilters,
  onClearFilters,
  onClose,
  embedded = false,
  mapColumnVisible = false,
  showMapColumnPrompt = false,
  onOpenMapColumn,
  onMapHover,
  sort,
  onSortChange,
  showGuestCatalogPreview = false,
  listPanelWidthPx,
  onToggleTripTopic,
  onTogglePlaceTopic,
  onActivityDatePresetChange,
  onVenueRegionsChange,
  hideBucketToggleOnMobile = false,
}: ListExplorerProps) => {
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  const stickySearch = query.trim().length > 0;
  const resultCount = loading ? null : cards.length;
  const showCalendar = bucket !== 'places';
  const effectiveLayout = showCalendar ? layout : layout === 'calendar' ? 'thumbnails' : layout;
  const locationEnabled = bucket === 'places' || listExplorerSortUsesViewerLocation(sort);
  const { fix: viewer, pending: locationPending, denied: locationDenied } = useViewerLocation(locationEnabled);
  const { units } = useDisplayPreferences();
  const showDistance = bucket === 'places' || listExplorerSortShowsDistance(sort);
  const listSections = useMemo(() => {
    const sorted = sortListExplorerCards(cards, sort, viewer);
    return groupListExplorerSections(sorted, sort, viewer);
  }, [cards, sort, viewer]);
  const calendarCards = useMemo(
    () => sortListExplorerCards(cards, sort, viewer),
    [cards, sort, viewer]
  );

  return (
    <div
      className={`relative flex h-full min-h-0 flex-col overflow-hidden bg-neutral-50 ${
        mapColumnVisible && listPanelWidthPx != null
          ? 'shrink-0'
          : mapColumnVisible
            ? 'min-w-[360px] max-w-[680px] shrink basis-[450px]'
            : 'min-w-0 flex-1'
      }`}
      style={
        mapColumnVisible && listPanelWidthPx != null
          ? { width: listPanelWidthPx, flex: '0 0 auto' }
          : undefined
      }
    >
      <ListExplorerHeader
        query={query}
        onQueryChange={onQueryChange}
        onQuerySync={onQuerySync}
        onSearchCommit={onSearchCommit}
        onClearQuery={onClearQuery}
        searchScopeCounts={searchScopeCounts}
        mapHref={mapHref}
        layout={effectiveLayout}
        onLayoutChange={onLayoutChange}
        bucket={bucket}
        onBucketChange={onBucketChange}
        resultCount={resultCount}
        stickySearch={stickySearch}
        onClose={onClose}
        showMapColumnPrompt={showMapColumnPrompt}
        onOpenMapColumn={onOpenMapColumn}
        mapColumnVisible={mapColumnVisible}
        sort={sort}
        onSortChange={onSortChange}
        locationPending={locationPending}
        locationDenied={locationDenied}
        filters={filters}
        regions={regions}
        onToggleTripTopic={onToggleTripTopic}
        onTogglePlaceTopic={onTogglePlaceTopic}
        onActivityDatePresetChange={onActivityDatePresetChange}
        onVenueRegionsChange={onVenueRegionsChange}
        hideBucketToggleOnMobile={hideBucketToggleOnMobile}
      />
      <div
        ref={setScrollElement}
        className={`${APP_SCROLL_BODY_CLASS} min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain ${
          embedded
            ? 'pb-6'
            : 'pb-[calc(var(--bottom-nav-height,56px)+var(--safe-bottom,0px)+24px)]'
        }`}
      >
        <div
          className={`mx-auto w-full px-3 py-3 ${
            embedded || mapColumnVisible
              ? 'max-w-none md:px-4 md:py-4'
              : 'max-w-6xl md:px-6 md:py-5'
          }`}
        >
          {showGuestCatalogPreview ? <ListGuestCatalogPreviewNotice className="mb-3" /> : null}
          {loading ? (
            <ThumbnailSkeleton compactThumbGrid={mapColumnVisible} />
          ) : error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm font-semibold text-red-900">Could not load plans right now.</p>
              <button
                type="button"
                onClick={onRetry}
                className={`mt-3 min-h-11 rounded-2xl px-4 text-sm font-bold ${EXPLORE_BRAND_ACTIVE}`}
              >
                Try again
              </button>
            </div>
          ) : cards.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <p className="text-sm font-medium text-neutral-600">{BROWSE_LIST_EMPTY}</p>
              {filterCount > 0 || query.trim() ? (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="mt-4 text-sm font-semibold text-emerald-700"
                >
                  {BROWSE_LIST_CLEAR_FILTERS}
                </button>
              ) : null}
            </div>
          ) : effectiveLayout === 'calendar' ? (
            <ListExplorerCalendar cards={calendarCards} onMapHover={onMapHover} />
          ) : (
            <PlaceDistanceProvider viewer={viewer} units={units}>
              <ListExplorerDateGroups
                sections={listSections}
                layout={effectiveLayout}
                onMapHover={onMapHover}
                compactThumbGrid={mapColumnVisible}
                showDistance={showDistance}
                scrollElement={scrollElement}
              />
            </PlaceDistanceProvider>
          )}
        </div>
      </div>
      <ListExplorerFilterFab
        bucket={bucket}
        applied={filters}
        regions={regions}
        filterCount={filterCount}
        onApply={onApplyFilters}
      />
    </div>
  );
};
