import { useMemo, useState, type ReactNode } from 'react';
import { useExploreDesktopListDrawerChrome } from '../../explore/ui/ExploreDesktopListDrawer';
import { useExplorePublishedDestinations } from '../../explore/useExplorePublishedDestinations';
import { buildBrowseCollapsedRailLabels } from '../browse/browseCollapsedRailLabels';
import { useBrowseGeoScopeHydration } from '../browse/useBrowseGeoScopeHydration';
import { BrowsePanelCollapsedRail } from './BrowsePanelCollapsedRail';
import { useVirtualizer } from '@tanstack/react-virtual';
import { EXPLORE_BRAND_ACTIVE } from '../../config/exploreTheme';
import { APP_SCROLL_BODY_CLASS } from '../../config/layoutScroll';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../../explore/exploreBrowseTaxonomy';
import { BROWSE_LIST_CLEAR_FILTERS, BROWSE_LIST_EMPTY } from '../browse/browseListCopy';
import type { BrowseListFilterState } from '../browse/browseListFilters';
import type { PlaceKind } from '@uaetrail/shared-types';
import type { ExplorePriceFilter } from '../../explore/exploreOptionalFilters';
import type { BrowseTripTopicKey } from '../browse/browseListTripTopics';
import type { ListVenuePlaceTopicKey } from '../browse/listVenuePlaceTopics';
import type { ExploreActivityDatePreset } from '../../explore/exploreActivityDateFilter';
import { ListExplorerCalendar } from './ListExplorerCalendar';
import { ListExplorerFilterFab } from './ListExplorerFilterFab';
import { ListExplorerHeader } from './ListExplorerHeader';
import { BrowseCompactRow } from '../browse/BrowseCompactRow';
import { BrowseThumbnailCard } from '../browse/BrowseThumbnailCard';
import { BrowsePlaceDistanceProvider } from '../browse/browsePlaceDistanceContext';
import { useBrowseViewerLocation } from '../browse/useBrowseViewerLocation';
import { useDisplayPreferences } from '../../preferences/useDisplayPreferences';
import type { BrowseListBucket } from '../browse/browseListBucket';
import type { BrowseListLayout } from '../browse/browseListLayout';
import type { BrowseListDateSection } from '../browse/browseListDateSections';
import { ListGuestCatalogPreviewNotice } from './ListGuestCatalogPreviewNotice';
import {
  groupBrowseListSections,
  browseListSortUsesViewerLocation,
  sortBrowseListCards,
  type BrowseListSortMode,
} from '../browse/listBrowseSort';

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
  layout: BrowseListLayout;
  onLayoutChange: (layout: BrowseListLayout) => void;
  bucket: BrowseListBucket;
  onBucketChange: (bucket: BrowseListBucket) => void;
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
  sort: BrowseListSortMode;
  onSortChange: (mode: BrowseListSortMode) => void;
  showGuestCatalogPreview?: boolean;
  listPanelWidthPx?: number;
  onTripTopicsChange: (next: BrowseTripTopicKey[]) => void;
  onPlaceTopicsChange: (next: ListVenuePlaceTopicKey[]) => void;
  onPriceChange: (next: ExplorePriceFilter) => void;
  onHasTripChange: (next: boolean) => void;
  onFacilityKindsChange: (next: PlaceKind[]) => void;
  onVenueFiltersChange?: (next: { placeTopics: ListVenuePlaceTopicKey[]; facilityKinds: PlaceKind[] }) => void;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  onVenueRegionsChange: (regions: string[]) => void;
  /** Standalone `/list` on mobile — Trips/Venues use bottom nav instead of in-page toggle. */
  hideBucketToggleOnMobile?: boolean;
  suppressSearch?: boolean;
  suppressMapListToggle?: boolean;
  searchResultsChrome?: boolean;
  /** `/explore/search` — map/list only via results chrome (not hub toggle). */
  exploreSearchResults?: boolean;
  suppressDateSectionHeaders?: boolean;
  searchPlaceholder?: string;
  enableSearchScopeHints?: boolean;
  scrollLeading?: ReactNode;
  scrollFooter?: ReactNode;
  geoPath?: string[];
  onClearGeoScope?: () => void;
  onPopGeoScope?: () => void;
};

const thumbGridClass = (sideMap: boolean) =>
  `list-explorer-thumb-grid grid grid-cols-1 gap-3 ${
    sideMap ? 'list-explorer-thumb-grid--side-map' : ''
  }`;

const LIST_VIRTUALIZE_MIN = 36;
const LIST_ROW_ESTIMATE_PX = 92;

const VirtualizedListRows = ({
  cards,
  onMapHover,
  scrollElement,
}: {
  cards: DiscoveryCardModel[];
  onMapHover?: (exploreItemId: string | null) => void;
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
            <BrowseCompactRow card={card} onMapHover={onMapHover} />
          </li>
        );
      })}
    </ul>
  );
};

const BrowseListDateSectionGroups = ({
  sections,
  layout,
  onMapHover,
  compactThumbGrid = false,
  scrollElement,
}: {
  sections: BrowseListDateSection[];
  layout: BrowseListLayout;
  onMapHover?: (exploreItemId: string | null) => void;
  compactThumbGrid?: boolean;
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
                scrollElement={scrollElement}
              />
            ) : (
            <ul className="space-y-2">
              {section.cards.map((card) => (
                <li key={card.id}>
                  <BrowseCompactRow card={card} onMapHover={onMapHover} />
                </li>
              ))}
            </ul>
            )
          ) : (
            <ul className={thumbGridClass(compactThumbGrid)}>
              {section.cards.map((card) => (
                <li key={card.id} className="min-w-0">
                  <BrowseThumbnailCard card={card} onMapHover={onMapHover} />
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
    {Array.from({ length: 4 }, (_, index) => (
      <div key={index} className="overflow-hidden rounded-xl bg-neutral-200">
        <div className="aspect-[3/2] w-full animate-pulse bg-neutral-300/80" />
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
  onTripTopicsChange,
  onPlaceTopicsChange,
  onPriceChange,
  onHasTripChange,
  onFacilityKindsChange,
  onVenueFiltersChange,
  onActivityDatePresetChange,
  onVenueRegionsChange,
  hideBucketToggleOnMobile = false,
  suppressSearch = false,
  suppressMapListToggle = false,
  searchResultsChrome = false,
  exploreSearchResults = false,
  suppressDateSectionHeaders = false,
  searchPlaceholder,
  enableSearchScopeHints = true,
  scrollLeading,
  scrollFooter,
  geoPath = [],
  onClearGeoScope,
  onPopGeoScope,
}: ListExplorerProps) => {
  const drawer = useExploreDesktopListDrawerChrome();
  const publishedAreas = useExplorePublishedDestinations();
  useBrowseGeoScopeHydration(geoPath);

  const collapsedRailLabels = useMemo(
    () =>
      buildBrowseCollapsedRailLabels({
        filters,
        regions,
        geoPath,
        bucket,
        publishedAreas,
      }),
    [bucket, filters, geoPath, publishedAreas, regions]
  );

  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  const stickySearch = query.trim().length > 0;
  const resultCount = loading ? null : cards.length;
  const showCalendar = bucket !== 'places';
  const calendarLayoutAllowed = showCalendar && !hideBucketToggleOnMobile;
  const effectiveLayout = calendarLayoutAllowed
    ? layout
    : layout === 'calendar'
      ? 'thumbnails'
      : layout;
  const locationEnabled = bucket === 'places' || browseListSortUsesViewerLocation(sort);
  const { fix: viewer, pending: locationPending, denied: locationDenied } =
    useBrowseViewerLocation(locationEnabled);
  const { units } = useDisplayPreferences();
  const listSections = useMemo(() => {
    const sorted = sortBrowseListCards(cards, sort, viewer);
    if (suppressDateSectionHeaders) {
      return sorted.length
        ? [{ key: 'all', label: '', cards: sorted }]
        : [];
    }
    return groupBrowseListSections(sorted, sort, viewer);
  }, [cards, sort, suppressDateSectionHeaders, viewer]);
  const calendarCards = useMemo(
    () => sortBrowseListCards(cards, sort, viewer),
    [cards, sort, viewer]
  );

  if (drawer?.collapsed) {
    return (
      <BrowsePanelCollapsedRail labels={collapsedRailLabels} onExpand={drawer.toggleCollapsed} />
    );
  }

  return (
    <div
      className={`relative flex h-full min-h-0 flex-col overflow-hidden ${
        'bg-neutral-50'
      } ${
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
        onTripTopicsChange={onTripTopicsChange}
        onPlaceTopicsChange={onPlaceTopicsChange}
        onPriceChange={onPriceChange}
        onHasTripChange={onHasTripChange}
        onFacilityKindsChange={onFacilityKindsChange}
        onVenueFiltersChange={onVenueFiltersChange}
        onActivityDatePresetChange={onActivityDatePresetChange}
        onVenueRegionsChange={onVenueRegionsChange}
        hideBucketToggleOnMobile={hideBucketToggleOnMobile}
        suppressSearch={suppressSearch}
        suppressMapListToggle={suppressMapListToggle}
        searchResultsChrome={searchResultsChrome}
        exploreSearchResults={exploreSearchResults}
        filterCount={filterCount}
        onApplyFilters={onApplyFilters}
        searchPlaceholder={searchPlaceholder}
        enableSearchScopeHints={enableSearchScopeHints}
        geoPath={geoPath}
        onClearGeoScope={onClearGeoScope}
        onPopGeoScope={onPopGeoScope}
      />
      <div
        ref={setScrollElement}
        className={`${APP_SCROLL_BODY_CLASS} min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain ${
          embedded
            ? 'pb-6'
            : 'pb-[calc(var(--bottom-nav-height,56px)+var(--safe-bottom,0px)+var(--explore-map-fab-inset,2.75rem)+3.75rem)]'
        }`}
      >
        <div
          className={`mx-auto w-full py-3 ${
            searchResultsChrome
              ? 'max-w-lg px-4 md:px-5 md:py-4'
              : embedded || mapColumnVisible
                ? 'max-w-none px-3 md:px-4 md:py-4'
                : 'max-w-6xl px-3 md:px-6 md:py-5'
          }`}
        >
          {scrollLeading}
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
            <BrowsePlaceDistanceProvider viewer={viewer} units={units}>
              <BrowseListDateSectionGroups
                sections={listSections}
                layout={effectiveLayout}
                onMapHover={onMapHover}
                compactThumbGrid={mapColumnVisible}
                scrollElement={scrollElement}
              />
            </BrowsePlaceDistanceProvider>
          )}
          {scrollFooter}
        </div>
      </div>
      {hideBucketToggleOnMobile ? null : (
        <ListExplorerFilterFab
          bucket={bucket}
          applied={filters}
          regions={regions}
          filterCount={filterCount}
          onApply={onApplyFilters}
          placement="floating"
        />
      )}
    </div>
  );
};
