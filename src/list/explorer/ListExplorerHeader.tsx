import { useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, Map, Maximize2, Minimize2, PanelLeftClose, Search, X } from 'lucide-react';
import { UiTooltip } from '../../components/ui/UiTooltip';
import { useExploreDesktopListDrawerChrome } from '../../explore/ui/ExploreDesktopListDrawer';
import { Link, useNavigate } from 'react-router-dom';
import { ExploreMapProjectionToggle } from '../../explore/ui/ExploreMapProjectionToggle';
import { EXPLORE_MAP_CHROME_FROST } from '../../config/exploreTheme';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../../explore/exploreBrowseTaxonomy';
import { LIST_APP_BAR, LIST_CHROME, LIST_SEARCH } from '../listChromeTheme';
import { ListDiscoverySearchField } from '../ui/ListDiscoverySearchField';
import { ListExplorerBucketToggle } from './ListExplorerBucketToggle';
import { ListExplorerViewSwitch } from './ListExplorerViewSwitch';
import {
  listExplorerSearchBucketCounts,
  type ListExplorerBucket,
} from '../browse/browseListBucket';
import type { ListExplorerLayout } from './listExplorerLayout';
import type { ListExplorerSortMode } from './listExplorerSort';
import { ListExplorerSortControl } from './ListExplorerSortControl';
import type { BrowseListFilterState } from '../browseListFilters';
import type { PlaceKind } from '@uaetrail/shared-types';
import type { ExplorePriceFilter } from '../../explore/exploreOptionalFilters';
import type { BrowseTripTopicKey } from '../browseListTripTopics';
import type { ListVenuePlaceTopicKey } from '../listVenuePlaceTopics';
import type { ExploreActivityDatePreset } from '../../explore/exploreActivityDateFilter';
import { ListExplorerQuickFilters } from './ListExplorerQuickFilters';
import { ListExplorerFilterFab } from './ListExplorerFilterFab';
import { ListExplorerGeoScopeChip } from './ListExplorerGeoScopeChip';
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
  filters: BrowseListFilterState;
  regions: string[];
  onTripTopicsChange: (next: BrowseTripTopicKey[]) => void;
  onPlaceTopicsChange: (next: ListVenuePlaceTopicKey[]) => void;
  onPriceChange: (next: ExplorePriceFilter) => void;
  onHasTripChange: (next: boolean) => void;
  onFacilityKindsChange: (next: PlaceKind[]) => void;
  onVenueFiltersChange?: (next: { placeTopics: ListVenuePlaceTopicKey[]; facilityKinds: PlaceKind[] }) => void;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  onVenueRegionsChange: (regions: string[]) => void;
  hideBucketToggleOnMobile?: boolean;
  suppressSearch?: boolean;
  suppressMapListToggle?: boolean;
  searchResultsChrome?: boolean;
  exploreSearchResults?: boolean;
  filterCount?: number;
  onApplyFilters?: (state: BrowseListFilterState, regions: string[]) => void;
  searchPlaceholder?: string;
  enableSearchScopeHints?: boolean;
  geoPath?: string[];
  onClearGeoScope?: () => void;
  onPopGeoScope?: () => void;
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
  filters,
  regions,
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
  filterCount = 0,
  onApplyFilters,
  searchPlaceholder,
  enableSearchScopeHints = true,
  geoPath = [],
  onClearGeoScope,
  onPopGeoScope,
}: ListExplorerHeaderProps) => {
  const hideSideMapChrome = mapColumnVisible || showMapColumnPrompt;
  const standaloneListSurface = !onClose;
  const searching = query.trim().length > 0;
  const searchCounts = searching ? listExplorerSearchBucketCounts(searchScopeCounts) : null;
  const bucketTabCounts: Record<ListExplorerBucket, number | null> = searchCounts
    ? { events: searchCounts.events, places: searchCounts.places }
    : {
        events: bucket === 'events' ? resultCount : null,
        places: bucket === 'places' ? resultCount : null,
      };
  const drawer = useExploreDesktopListDrawerChrome();
  const navigate = useNavigate();
  const mobileListMapChrome = standaloneListSurface && hideBucketToggleOnMobile && !suppressMapListToggle;
  const compactSearchChrome =
    hideBucketToggleOnMobile && (suppressMapListToggle || searchResultsChrome);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(() => searching);

  useEffect(() => {
    if (query.trim().length > 0) {
      setMobileSearchOpen(true);
    }
  }, [query]);

  useEffect(() => {
    if (!mobileSearchOpen || !mobileListMapChrome) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileSearchOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileSearchOpen, mobileListMapChrome]);

  const filterFabProps =
    onApplyFilters != null
      ? {
          placement: 'inline' as const,
          bucket,
          applied: filters,
          regions,
          filterCount,
          onApply: onApplyFilters,
        }
      : null;

  const searchResultsMapListToggle =
    searchResultsChrome && !exploreSearchResults ? (
      <ExploreMapProjectionToggle
        mode="list"
        variant="map-only"
        toggleChrome="listSide"
        listCount={resultCount ?? 0}
        onSelectMap={() => navigate(mapHref)}
        onSelectList={() => {}}
      />
    ) : null;

  return (
    <header
      data-consumer-chrome-header
      data-explore-search-chrome={searchResultsChrome ? 'true' : undefined}
      className={`shrink-0 ${LIST_CHROME.chromeBg} ${LIST_CHROME.chromeBorder} ${
        stickySearch ? 'z-30 shadow-[0_4px_16px_rgba(15,23,42,.08)]' : ''
      }`}
    >
    <div
      className={`${onClose ? 'px-3' : searchResultsChrome ? 'px-4 md:px-5' : LIST_CHROME.horizontalPad} mx-auto w-full ${
        onClose || mapColumnVisible ? 'max-w-none' : searchResultsChrome ? 'max-w-lg' : 'max-w-6xl'
      } ${standaloneListSurface ? LIST_CHROME.standaloneMobileInset : 'pb-2.5 pt-1'}`}
    >
      {standaloneListSurface ? null : (
        <div className={`${LIST_APP_BAR.row} mb-1`}>
          <div className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-8 items-center gap-0.5 pl-0 text-sm font-medium text-emerald-700/90 hover:text-emerald-800"
              aria-label="Back to map"
            >
              <ChevronLeft className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
              <span className="truncate">Map</span>
            </button>
          </div>
          <div className="flex items-center gap-1">
            {drawer ? (
              <UiTooltip label={drawer.collapsed ? 'Show browse panel' : 'Collapse browse panel'}>
                <button
                  type="button"
                  onClick={drawer.toggleCollapsed}
                  className={`${LIST_SEARCH.sideAction} !h-10 !w-10 text-neutral-700`}
                  aria-label={drawer.collapsed ? 'Show browse panel' : 'Collapse browse panel'}
                  aria-pressed={drawer.collapsed}
                >
                  <PanelLeftClose className="h-5 w-5 stroke-[2.25]" aria-hidden />
                </button>
              </UiTooltip>
            ) : null}
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
          </div>
        </div>
      )}
      {mobileListMapChrome ? (
        <div className="md:hidden">
          <div className="flex h-8 min-w-0 items-center gap-2">
            <ExploreMapProjectionToggle
              mode="list"
              listCount={resultCount ?? 0}
              onSelectMap={() => navigate(mapHref)}
              onSelectList={() => {}}
            />
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {suppressSearch || searchResultsChrome ? null : (
                <UiTooltip label="Search">
                  <button
                    type="button"
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ring-black/5 ${EXPLORE_MAP_CHROME_FROST}`}
                    aria-label="Search"
                    aria-expanded={mobileSearchOpen}
                    onClick={() => setMobileSearchOpen((open) => !open)}
                  >
                    <Search className="h-4 w-4 text-neutral-800" strokeWidth={2.25} aria-hidden />
                  </button>
                </UiTooltip>
              )}
              {filterFabProps ? (
                <ListExplorerFilterFab {...filterFabProps} inlineChrome="mapFrost" />
              ) : null}
            </div>
          </div>
          {!searchResultsChrome && !suppressSearch && mobileSearchOpen ? (
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
              autoFocus
              className="!mt-2"
              placeholder={searchPlaceholder}
              enableScopeHints={enableSearchScopeHints}
              trailingChrome={searchResultsMapListToggle}
            />
          ) : null}
        </div>
      ) : null}
      {suppressSearch ? null : searchResultsChrome ? (
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 flex-1">
            <ListDiscoverySearchField
              query={query}
              onQueryChange={onQueryChange}
              onQuerySync={onQuerySync}
              onSearchCommit={onSearchCommit}
              onClearQuery={onClearQuery}
              searchScopeCounts={searchScopeCounts}
              mapHref={mapHref}
              hideMapLink
              placeholder={searchPlaceholder}
              enableScopeHints={enableSearchScopeHints}
              trailingChrome={searchResultsMapListToggle}
              compactTop
              className="!mt-0"
            />
          </div>
          {filterFabProps ? (
            <ListExplorerFilterFab {...filterFabProps} placement="inline" inlineChrome="listSide" />
          ) : null}
        </div>
      ) : (
        <ListDiscoverySearchField
          query={query}
          onQueryChange={onQueryChange}
          onQuerySync={onQuerySync}
          onSearchCommit={onSearchCommit}
          onClearQuery={onClearQuery}
          searchScopeCounts={searchScopeCounts}
          mapHref={mapHref}
          hideMapLink={hideSideMapChrome || standaloneListSurface}
          placeholder={searchPlaceholder}
          enableScopeHints={enableSearchScopeHints}
          filterSlot={
            filterFabProps && hideBucketToggleOnMobile ? (
              mobileListMapChrome ? (
                <span className="hidden md:contents">
                  <ListExplorerFilterFab {...filterFabProps} />
                </span>
              ) : (
                <ListExplorerFilterFab {...filterFabProps} />
              )
            ) : null
          }
          compactTop
          className={`!mt-0 ${mobileListMapChrome && !compactSearchChrome ? 'hidden md:block' : ''}`}
        />
      )}
      <div
        className={`mt-1.5 flex min-w-0 flex-row items-center justify-between gap-1 ${
          mapColumnVisible ? '' : 'gap-2 sm:gap-3'
        } ${hideBucketToggleOnMobile || searchResultsChrome ? 'max-md:hidden' : ''}`}
      >
        <div className={`flex min-w-0 items-center ${mapColumnVisible ? 'gap-1' : 'gap-2'}`}>
          <ListExplorerBucketToggle
            bucket={bucket}
            onChange={onBucketChange}
            bucketCounts={bucketTabCounts}
            compact={mapColumnVisible}
          />
        </div>
        <div className="flex min-w-0 shrink-0 items-center justify-end gap-1">
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
          ) : hideSideMapChrome || standaloneListSurface ? null : (
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
            compact={mapColumnVisible}
            className="min-w-0 shrink-0"
          />
          <ListExplorerViewSwitch
            layout={bucket === 'places' && layout === 'calendar' ? 'thumbnails' : layout}
            onChange={onLayoutChange}
            showCalendar={false}
            compact={mapColumnVisible}
          />
        </div>
      </div>
      <div className={`mt-2.5 ${searchResultsChrome ? 'max-md:mt-2' : ''}`}>
        {geoPath.length > 0 && onClearGeoScope ? (
          <ListExplorerGeoScopeChip
            geoPath={geoPath}
            onClear={onClearGeoScope}
            onPopLevel={onPopGeoScope}
          />
        ) : null}
        <ListExplorerQuickFilters
          surface="list"
          bucket={bucket}
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
        />
      </div>
    </div>
  </header>
  );
};
