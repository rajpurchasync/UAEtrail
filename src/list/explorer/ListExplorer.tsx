import { EXPLORE_BRAND_ACTIVE } from '../../config/exploreTheme';
import { APP_SCROLL_BODY_CLASS } from '../../config/layoutScroll';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../../explore/exploreBrowseTaxonomy';
import { BROWSE_LIST_CLEAR_FILTERS, BROWSE_LIST_EMPTY } from '../browseListCopy';
import type { BrowseListFilterState } from '../browseListFilters';
import { ListExplorerCalendar } from './ListExplorerCalendar';
import { ListExplorerFilterFab } from './ListExplorerFilterFab';
import { ListExplorerHeader } from './ListExplorerHeader';
import { ListExplorerListRow } from './ListExplorerListRow';
import { ListExplorerThumbnailCard } from './ListExplorerThumbnailCard';
import type { ListExplorerBucket } from './listExplorerBucket';
import type { ListExplorerLayout } from './listExplorerLayout';

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
};

const ThumbnailSkeleton = () => (
  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4" aria-hidden>
    {Array.from({ length: 6 }, (_, index) => (
      <div key={index} className="overflow-hidden rounded-2xl bg-neutral-200">
        <div className="aspect-[4/3] animate-pulse bg-neutral-300/80" />
        <div className="space-y-1.5 p-2.5">
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
}: ListExplorerProps) => {
  const stickySearch = query.trim().length > 0;
  const resultCount = loading ? null : cards.length;

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-neutral-50">
      <ListExplorerHeader
        query={query}
        onQueryChange={onQueryChange}
        onQuerySync={onQuerySync}
        onSearchCommit={onSearchCommit}
        onClearQuery={onClearQuery}
        searchScopeCounts={searchScopeCounts}
        mapHref={mapHref}
        layout={layout}
        onLayoutChange={onLayoutChange}
        bucket={bucket}
        onBucketChange={onBucketChange}
        resultCount={resultCount}
        stickySearch={stickySearch}
      />
      <div
        className={`${APP_SCROLL_BODY_CLASS} min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain pb-[calc(var(--bottom-nav-height,56px)+var(--safe-bottom,0px)+24px)]`}
      >
        <div className="mx-auto w-full max-w-6xl px-3 py-3 md:px-6 md:py-5">
          {loading ? (
            <ThumbnailSkeleton />
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
          ) : layout === 'calendar' ? (
            <ListExplorerCalendar cards={cards} />
          ) : layout === 'list' ? (
            <ul className="space-y-2">
              {cards.map((card) => (
                <li key={card.id}>
                  <ListExplorerListRow card={card} />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {cards.map((card) => (
                <li key={card.id} className="min-w-0">
                  <ListExplorerThumbnailCard card={card} />
                </li>
              ))}
            </ul>
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
