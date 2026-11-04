import { ChevronLeft, Map, Maximize2, Minimize2, X } from 'lucide-react';
import { UiTooltip } from '../../components/ui/UiTooltip';
import { useExploreDesktopListDrawerChrome } from '../../explore/ui/ExploreDesktopListDrawer';
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
import type { ListExplorerSortMode } from './listExplorerSort';
import { ListExplorerSortControl } from './ListExplorerSortControl';

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
  onClose?: () => void;
  showMapColumnPrompt?: boolean;
  onOpenMapColumn?: () => void;
  mapColumnVisible?: boolean;
  sort: ListExplorerSortMode;
  onSortChange: (mode: ListExplorerSortMode) => void;
  locationPending?: boolean;
  locationDenied?: boolean;
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
  onClose,
  showMapColumnPrompt = false,
  onOpenMapColumn,
  mapColumnVisible = false,
  sort,
  onSortChange,
  locationPending,
  locationDenied,
}: ListExplorerHeaderProps) => {
  const hideSideMapChrome = mapColumnVisible || showMapColumnPrompt;
  const searching = query.trim().length > 0;
  const searchCounts = searching ? listExplorerSearchBucketCounts(searchScopeCounts) : null;
  const drawer = useExploreDesktopListDrawerChrome();

  return (
    <header
      className={`${LIST_CHROME.chromeBg} ${LIST_CHROME.chromeBorder} shrink-0 ${
        stickySearch ? 'z-30 shadow-[0_4px_16px_rgba(15,23,42,.08)]' : ''
      }`}
    >
    <div
      className={`${onClose ? 'px-3' : LIST_CHROME.horizontalPad} mx-auto w-full ${
        onClose || mapColumnVisible ? 'max-w-none' : 'max-w-6xl'
      } pb-2.5 pt-1`}
    >
      <div className={`${LIST_APP_BAR.row} mb-1 ${onClose ? '' : 'md:hidden'}`}>
        <div className="flex min-w-0 items-center gap-1">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-8 items-center gap-0.5 pl-0 text-sm font-medium text-emerald-700/90 hover:text-emerald-800"
              aria-label="Back to Explore"
            >
              <ChevronLeft className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
              <span className="truncate">Explore</span>
            </button>
          ) : (
            <div className="md:hidden">
              <MobileBackButton fallbackTo={mapHref} label="Explore" className="!min-h-10 pl-0" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onClose ? (
            <>
              {drawer ? (
                <UiTooltip label={drawer.maximized ? 'Exit full screen' : 'Full screen'}>
                <button
                  type="button"
                  onClick={drawer.toggleMaximized}
                  className={`${LIST_SEARCH.sideAction} !h-10 !w-10 text-neutral-700`}
                  aria-label={drawer.maximized ? 'Exit full screen' : 'Full screen'}
                  aria-pressed={drawer.maximized}
                >
                  {drawer.maximized ? (
                    <Minimize2 className="h-5 w-5 stroke-[2.25]" aria-hidden />
                  ) : (
                    <Maximize2 className="h-5 w-5 stroke-[2.25]" aria-hidden />
                  )}
                </button>
                </UiTooltip>
              ) : null}
              <UiTooltip label="Close list">
              <button
                type="button"
                onClick={onClose}
                className={`${LIST_SEARCH.sideAction} ${LIST_SEARCH.sideActionMap} !h-10 !w-10 text-neutral-700`}
                aria-label="Close list"
              >
                <X className="h-5 w-5 stroke-[2.25]" aria-hidden />
              </button>
              </UiTooltip>
            </>
          ) : (
            <MobileMenuButton className={LIST_CHROME.menuButton} />
          )}
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
        hideMapLink={hideSideMapChrome}
        compactTop
        className="!mt-0"
      />
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="flex min-w-0 items-center justify-end gap-1.5">
          {onClose ? null : showMapColumnPrompt && onOpenMapColumn ? (
            <UiTooltip label="Show map alongside list">
              <button
                type="button"
                onClick={onOpenMapColumn}
                className={`${LIST_SEARCH.sideAction} ${LIST_SEARCH.sideActionMap} !hidden !h-8 !w-auto min-w-8 max-w-[10rem] gap-1 px-2 text-emerald-700 md:!inline-flex`}
                aria-label="Show map alongside list"
              >
                <Map className="h-4 w-4 shrink-0 stroke-[2.25]" aria-hidden />
                <span className="hidden min-w-0 truncate text-[11px] font-semibold sm:inline">
                  Map · Alongside
                </span>
              </button>
            </UiTooltip>
          ) : hideSideMapChrome ? null : (
            <UiTooltip label="Open explore map">
              <Link
                to={mapHref}
                className={`${LIST_SEARCH.sideAction} ${LIST_SEARCH.sideActionMap} !hidden !h-8 !w-auto min-w-8 gap-1 px-2 text-emerald-700 md:!inline-flex`}
                aria-label="Open explore map"
              >
                <Map className="h-4 w-4 shrink-0 stroke-[2.25]" aria-hidden />
                <span className="hidden text-[11px] font-semibold sm:inline">Map</span>
              </Link>
            </UiTooltip>
          )}
          <ListExplorerSortControl
            sort={sort}
            onSortChange={onSortChange}
            locationPending={locationPending}
            locationDenied={locationDenied}
            className="min-w-0 flex-1 sm:max-w-[10.5rem] md:max-w-[11rem]"
          />
          <ListExplorerViewSwitch
            layout={bucket === 'places' && layout === 'calendar' ? 'thumbnails' : layout}
            onChange={onLayoutChange}
            showCalendar={bucket !== 'places'}
          />
        </div>
      </div>
    </div>
  </header>
  );
};
