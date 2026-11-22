import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { setExploreClockStyle, type ExploreMapItemDTO, type GeoKind } from '@uaetrail/shared-types';
import { useAuth } from '../context/AuthContext';
import { useDisplayPreferences } from '../preferences/useDisplayPreferences';
import { useMinWidthMd } from '../hooks/useMinWidthMd';
import { countExploreSearchScopes } from '../explore/exploreSearchMatches';
import { Link } from 'react-router-dom';
import { explorePath } from '../explore/routing';
import { listDiscoveryPath } from '../list/browse/browseListRouting';
import { buildListFeedCards } from '../list/browse/buildListFeedCards';
import {
  cardMatchesBrowsePrice,
  filterExploreMapItemsForList,
  type BrowseListFilterState,
} from '../list/browse/browseListFilters';
import { browseListFilterPatchForSearchScope } from '../list/browse/browseListSearchCommit';
import { ListExplorer } from '../list/explorer/ListExplorer';
import { ListDiscoveryMapColumn } from '../list/explorer/ListDiscoveryMapColumn';
import { ListSideMapResizeHandle } from '../list/explorer/ListSideMapResizeHandle';
import { useListSideMapWidth } from '../list/explorer/useListSideMapWidth';
import {
  browseListBucketCategories,
  type BrowseListBucket,
} from '../list/browse/browseListBucket';
import {
  DEFAULT_BROWSE_LIST_SORT,
  type BrowseListSortMode,
} from '../list/browse/listBrowseSort';
import { countBrowseListFilters, type BrowseListLayout } from '../list/browse/browseListLayout';
import type { ExploreSearchScopeKey } from '../explore/exploreBrowseTaxonomy';
import { useExplorePublishedAreasQuery } from '../explore/useExplorePublishedAreas';
import { useBrowseGeoScopeHydration } from '../list/browse/useBrowseGeoScopeHydration';
import '../styles/explore-map-chrome.css';

const EMPTY_GEO_IDS: string[] = [];

const EMPTY_FILTERS: BrowseListFilterState = {
  query: '',
  categories: [],
  tripTopics: [],
  tripAvailabilityOnly: false,
  placeTopics: [],
  price: 'all',
  when: 'any',
  activityDatePreset: 'anyday',
  crewBrowseLane: 'people',
  crewPeopleFacet: 'recommended',
  hasTrip: false,
  facilityKinds: [],
  audience: 'anyone',
};

type GeoBrowsePaneProps = {
  bucket: BrowseListBucket;
  onBucketChange: (bucket: BrowseListBucket) => void;
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
  lockGeoKind: _lockGeoKind = null,
}: GeoBrowsePaneProps) => {
  void _lockGeoKind;
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
  const [layout, setLayout] = useState<BrowseListLayout>('thumbnails');
  const [sort, setSort] = useState<BrowseListSortMode>(DEFAULT_BROWSE_LIST_SORT);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const sideMapWidth = useListSideMapWidth(desktopMd);
  const { data: publishedAreas = [] } = useExplorePublishedAreasQuery();

  const scopedFilters = useMemo<BrowseListFilterState>(
    () => ({
      ...filters,
      query: draftQuery,
      categories: browseListBucketCategories(bucket),
    }),
    [filters, draftQuery, bucket]
  );

  const drillGeoIds = geoIds.length > lockGeoIds.length ? geoIds : EMPTY_GEO_IDS;
  useBrowseGeoScopeHydration(drillGeoIds);

  const handleClearGeoScope = useCallback(() => setGeoIds(lockGeoIds), [lockGeoIds]);
  const handlePopGeoScope = useCallback(
    () => setGeoIds((prev) => (prev.length > lockGeoIds.length ? prev.slice(0, -1) : prev)),
    [lockGeoIds.length]
  );
  const filteredItems = useMemo(
    () => filterExploreMapItemsForList(items, scopedFilters, regions, drillGeoIds, publishedAreas),
    [items, scopedFilters, regions, drillGeoIds, publishedAreas]
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

  const filterCount = countBrowseListFilters(
    filters,
    regions,
    bucket,
    geoIds.length,
    lockGeoIds.length
  );

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
        tripAvailabilityOnly: false,
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

  const fullListHref = useMemo(() => {
    if (!lockGeoId) return null;
    const listCat = bucket === 'places' ? 'venues' : 'activities';
    return listDiscoveryPath({
      listCat,
      categories: browseListBucketCategories(bucket),
      geoPath: geoIds,
    });
  }, [lockGeoId, bucket, geoIds]);

  const scrollLeading = (
    <>
      {leading ? <div className="mb-4">{leading}</div> : null}
      {fullListHref ? (
        <Link
          to={fullListHref}
          className="mb-3 inline-flex text-sm font-semibold text-emerald-700 hover:underline"
        >
          Open in full list
        </Link>
      ) : null}
    </>
  );

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
        filterCount={filterCount}
        onApplyFilters={(state, nextRegions) => {
          setFilters({ ...state, query: draftQuery });
          setRegions(nextRegions);
        }}
        onClearFilters={clearFilters}
        onTripTopicsChange={(next) =>
          setFilters((prev) => ({ ...prev, tripTopics: next, tripAvailabilityOnly: false }))
        }
        onPlaceTopicsChange={(next) => setFilters((prev) => ({ ...prev, placeTopics: next }))}
        onPriceChange={(next) => setFilters((prev) => ({ ...prev, price: next }))}
        onHasTripChange={(next) => setFilters((prev) => ({ ...prev, hasTrip: next }))}
        onFacilityKindsChange={(next) => setFilters((prev) => ({ ...prev, facilityKinds: next }))}
        onActivityDatePresetChange={(next) =>
          setFilters((prev) => ({ ...prev, activityDatePreset: next }))
        }
        onVenueRegionsChange={setRegions}
        embedded
        mapColumnVisible={desktopMd}
        onMapHover={desktopMd ? setHighlightedId : undefined}
        sort={sort}
        onSortChange={setSort}
        listPanelWidthPx={desktopMd ? sideMapWidth.listPanelWidth : undefined}
        scrollLeading={scrollLeading}
        geoPath={geoIds.length > lockGeoIds.length ? geoIds : undefined}
        onClearGeoScope={geoIds.length > lockGeoIds.length ? handleClearGeoScope : undefined}
        onPopGeoScope={
          geoIds.length > lockGeoIds.length && geoIds.length > 1 ? handlePopGeoScope : undefined
        }
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
