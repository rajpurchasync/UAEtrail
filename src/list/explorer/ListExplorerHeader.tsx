import { Map } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MobileBackButton } from '../../components/mobile/MobileBackButton';
import { MobileMenuButton } from '../../components/layout/MobileMenu';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../../explore/exploreBrowseTaxonomy';
import { LIST_APP_BAR, LIST_CHROME, LIST_SEARCH } from '../listChromeTheme';
import { ListDiscoverySearchField } from '../ui/ListDiscoverySearchField';
import { ListExplorerBucketToggle } from './ListExplorerBucketToggle';
import { ListExplorerViewSwitch } from './ListExplorerViewSwitch';
import {
  listExplorerBucketTotalLabel,
  listExplorerSearchBucketCounts,
  type ListExplorerBucket,
} from './listExplorerBucket';
import type { ListExplorerLayout } from './listExplorerLayout';

type ListExplorerHeaderProps = {
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
  resultCount: number | null;
  stickySearch: boolean;
};

export const ListExplorerHeader = ({
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
  resultCount,
  stickySearch,
}: ListExplorerHeaderProps) => {
  const searching = query.trim().length > 0;
  const searchCounts = searching ? listExplorerSearchBucketCounts(searchScopeCounts) : null;

  return (
    <header
      className={`${LIST_CHROME.chromeBg} ${LIST_CHROME.chromeBorder} shrink-0 ${
        stickySearch ? 'z-30 shadow-[0_4px_16px_rgba(15,23,42,.08)]' : ''
      }`}
    >
    <div className={`${LIST_CHROME.horizontalPad} mx-auto w-full max-w-6xl pb-2.5 pt-1`}>
      <div className={`${LIST_APP_BAR.row} mb-1`}>
        <div className="flex min-w-0 items-center gap-1">
          <MobileBackButton fallbackTo={mapHref} label="Explore" className="!min-h-10 pl-0" />
        </div>
        <div className="flex items-center gap-1">
          <Link
            to={mapHref}
            className={`${LIST_SEARCH.sideAction} ${LIST_SEARCH.sideActionMap} !h-10 !w-10 text-emerald-700`}
            aria-label="Map"
          >
            <Map className="h-5 w-5 stroke-[2.25]" aria-hidden />
          </Link>
          <MobileMenuButton className={LIST_CHROME.menuButton} />
        </div>
      </div>
      <ListDiscoverySearchField
        query={query}
        onQueryChange={onQueryChange}
        onQuerySync={onQuerySync}
        onSearchCommit={onSearchCommit}
        onClearQuery={onClearQuery}
        searchScopeCounts={searchScopeCounts}
        mapHref={mapHref}
        hideMapLink
        compactTop
        className="!mt-0"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <ListExplorerBucketToggle
            bucket={bucket}
            onChange={onBucketChange}
            searchCounts={searchCounts}
          />
          <p className="truncate text-xs font-semibold tabular-nums text-neutral-500">
            {resultCount == null ? ' ' : listExplorerBucketTotalLabel(bucket, resultCount)}
          </p>
        </div>
        <ListExplorerViewSwitch layout={layout} onChange={onLayoutChange} />
      </div>
    </div>
  </header>
  );
};
