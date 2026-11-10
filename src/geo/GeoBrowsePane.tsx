import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { setExploreClockStyle, type ExploreMapItemDTO, type GeoKind } from '@uaetrail/shared-types';
import { useAuth } from '../context/AuthContext';
import { useDisplayPreferences } from '../preferences/useDisplayPreferences';
import { useMinWidthMd } from '../hooks/useMinWidthMd';
import { countExploreSearchScopes } from '../explore/exploreSearchMatches';
import { explorePath } from '../explore/routing';
import { buildListFeedCards } from '../list/buildListFeedCards';
import {
  cardMatchesBrowsePrice,
  filterExploreMapItemsForList,
  type BrowseListFilterState,
} from '../list/browseListFilters';
import { browseListFilterPatchForSearchScope } from '../list/listDiscoverySearchCommit';
import { ListExplorer } from '../list/explorer/ListExplorer';
import { ListDiscoveryMapColumn } from '../list/explorer/ListDiscoveryMapColumn';
import { ListSideMapResizeHandle } from '../list/explorer/ListSideMapResizeHandle';
import { useListSideMapWidth } from '../list/explorer/useListSideMapWidth';
import {
  listExplorerBucketCategories,
  type ListExplorerBucket,
} from '../list/explorer/listExplorerBucket';
import {
  DEFAULT_LIST_EXPLORER_SORT,
  type ListExplorerSortMode,
} from '../list/explorer/listExplorerSort';
import { countListExplorerFilters, type ListExplorerLayout } from '../list/explorer/listExplorerLayout';
import type { ExploreSearchScopeKey } from '../explore/exploreBrowseTaxonomy';
import '../styles/explore-map-chrome.css';

const EMPTY_GEO_IDS: string[] = [];

const EMPTY_FILTERS: BrowseListFilterState = {
  query: '',
  categories: [],
  tripTopics: [],
  tripLookingOnly: false,
  placeTopics: [],
  price: 'all',
  when: 'any',
  activityDatePreset: 'anyday',
  buddiesSegment: 'looking',
};

type GeoBrowsePaneProps = {
  bucket: ListExplorerBucket;
  onBucketChange: (bucket: ListExplorerBucket) => void;
  items: ExploreMapItemDTO[];
  catalogItems: ExploreMapItemDTO[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  leading?: ReactNode;
  lockGeoId?: string | null;
  lockGeoKind?: GeoKind | null;
};

export const GeoBrowsePane = ({
  bucket,
  onBucketChange,
  items,
  catalogItems,
  loading,
  error,
  hasMore,
  loadingMore,
  onLoadMore,
  leading,
  lockGeoId = null,
  lockGeoKind = null,
}: GeoBrowsePaneProps) => {
  const { user } = useAuth();
  const { clock } = useDisplayPreferences();
  const desktopMd = useMinWidthMd();
  const [draftQuery, setDraftQuery] = useState('');
  const [filters, setFilters] = useState<BrowseListFilterState>(EMPTY_FILTERS);
  const [regions, setRegions] = useState<string[]>([]);
  const lockGeoIds = lockGeoId ? [lockGeoId] : [];
  const [geoIds, setGeoIds] = useState<string[]>(lockGeoIds);

  useEffect(() => {
    if (!lockGeoId) return;
    setGeoIds((prev) => (prev[0] === lockGeoId ? prev : [lockGeoId]));
  }, [lockGeoId]);
  const [layout, setLayout] = useState<ListExplorerLayout>('thumbnails');
  const [sort, setSort] = useState<ListExplorerSortMode>(DEFAULT_LIST_EXPLORER_SORT);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const sideMapWidth = useListSideMapWidth(desktopMd);

  const scopedFilters = useMemo<BrowseListFilterState>(
    () => ({
      ...filters,
      query: draftQuery,
      categories: listExplorerBucketCategories(bucket),
    }),
    [filters, draftQuery, bucket]
  );

  const drillGeoIds = geoIds.length > lockGeoIds.length ? geoIds : EMPTY_GEO_IDS;
  const filteredItems = useMemo(
    () => filterExploreMapItemsForList(items, scopedFilters, regions, drillGeoIds),
    [items, scopedFilters, regions, drillGeoIds]
  );

  const cards = useMemo(() => {
    setExploreClockStyle(clock);
    const built = buildListFeedCards(filteredItems, user, catalogItems);
    return bucket === 'events' ? built.filter((card) => cardMatchesBrowsePrice(card, filters.price)) : built;
  }, [filteredItems, user, catalogItems, clock, bucket, filters.price]);

  const searchScopeCounts = useMemo(
    () => countExploreSearchScopes(catalogItems, draftQuery, filters.activityDatePreset, regions),
    [catalogItems, draftQuery, filters.activityDatePreset, regions]
  );

  const filterCount = countListExplorerFilters(filters, regions, bucket, geoIds, lockGeoIds.length);

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setRegions([]);
    setGeoIds(lockGeoIds);
    setDraftQuery('');
  };

  const handleSearchCommit = (scope?: ExploreSearchScopeKey | null) => {
    if (scope === 'places' || scope === 'shops') {
      const patch = browseListFilterPatchForSearchScope(scope);
      setFilters((prev) => ({
        ...prev,
        query: draftQuery,
        tripTopics: [],
        tripLookingOnly: false,
        placeTopics: patch?.placeTopics ?? [],
      }));
      onBucketChange('places');
      return;
    }
    if (scope === 'activities') {
      setFilters((prev) => ({ ...prev, query: draftQuery, placeTopics: [] }));
      onBucketChange('events');
    }
  };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
      },
      { rootMargin: '240px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, items.length]);

  const handleSelectItem = useCallback((item: ExploreMapItemDTO) => {
    setSelectedId(item.id);
    setHighlightedId(item.id);
  }, []);

  return (
    <div
      ref={sideMapWidth.splitRef}
      className="flex h-0 min-h-0 min-w-0 flex-1 flex-row overflow-hidden"
    >
      <ListExplorer
        cards={cards}
        loading={loading && items.length === 0}
        error={Boolean(error)}
        onRetry={onLoadMore}
        query={draftQuery}
        onQueryChange={setDraftQuery}
        onQuerySync={() => setFilters((prev) => ({ ...prev, query: draftQuery }))}
        onSearchCommit={handleSearchCommit}
        onClearQuery={() => {
          setDraftQuery('');
          setFilters((prev) => ({ ...prev, query: '' }));
        }}
        searchScopeCounts={searchScopeCounts}
        mapHref={explorePath()}
        layout={layout}
        onLayoutChange={(next) => {
          setLayout(next);
        }}
        bucket={bucket}
        onBucketChange={(next) => {
          if (next === 'places' && layout === 'calendar') setLayout('thumbnails');
          onBucketChange(next);
        }}
        filters={scopedFilters}
        regions={regions}
        geoIds={geoIds}
        lockGeoIds={lockGeoIds}
        lockGeoKind={lockGeoKind}
        filterCount={filterCount}
        onApplyFilters={(state, nextRegions, nextGeoIds) => {
          setFilters({ ...state, query: draftQuery });
          setRegions(nextRegions);
          setGeoIds(nextGeoIds.length > 0 ? nextGeoIds : lockGeoIds);
        }}
        onClearFilters={clearFilters}
        embedded
        mapColumnVisible={desktopMd}
        onMapHover={desktopMd ? setHighlightedId : undefined}
        sort={sort}
        onSortChange={setSort}
        listPanelWidthPx={desktopMd ? sideMapWidth.listPanelWidth : undefined}
        scrollLeading={leading ? <div className="mb-4">{leading}</div> : null}
        scrollFooter={
          hasMore ? (
            <div ref={sentinelRef} className="flex justify-center py-3">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-60"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          ) : null
        }
      />
      {desktopMd ? (
        <>
          <ListSideMapResizeHandle
            getStartWidth={sideMapWidth.getStartListWidth}
            onWidthChange={sideMapWidth.setListPanelWidthClamped}
            onResizeCommit={sideMapWidth.commitListPanelWidth}
            ariaValueNow={sideMapWidth.listPanelWidth}
            ariaValueMax={sideMapWidth.listPanelMaxPx()}
          />
          <ListDiscoveryMapColumn
            items={filteredItems}
            loading={loading && filteredItems.length === 0}
            highlightedExploreItemId={highlightedId}
            selectedExploreItemId={selectedId}
            onSelectItem={handleSelectItem}
            layoutRevision={sideMapWidth.listPanelWidth}
          />
        </>
      ) : null}
    </div>
  );
};
