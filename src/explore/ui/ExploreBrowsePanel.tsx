import { PanelLeftClose, Search, X } from 'lucide-react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { PRODUCT_EXPLORE_EMPTY_FILTERS } from '../../content/productNorthStar';
import {
  EXPLORE_LIST_FILTER_INACTIVE,
  EXPLORE_SHEET,
  exploreActivityListFilterActiveClass,
  exploreVenueListFilterActiveClass,
} from '../../config/exploreTheme';
import type { ActivityListFilterKey, ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import { buildExploreCardModel } from '../exploreCardModel';
import { ExploreFilterIcon } from './ExploreFilterIcon';
import { ExploreListRow } from './ExploreListRow';
import { ExploreListSkeleton } from './ExploreListSkeleton';
import {
  ACTIVITY_LIST_FILTERS,
  browseListEmptyMessage,
  DESKTOP_BROWSE_TABS,
  desktopBrowseListTitle,
  desktopSearchPlaceholder,
  type DesktopBrowseTab,
  panelListTitle,
  panelSearchPlaceholder,
  PANEL_TABS,
  type ShopListSections,
  VENUE_LIST_FILTERS,
} from './exploreBrowsePanelCopy';

export interface ExploreBrowsePanelProps {
  isDesktop: boolean;
  loading: boolean;
  listItems: ExploreMapItemDTO[];
  shopListSections: ShopListSections | null;
  desktopBrowseTab: DesktopBrowseTab;
  mapFilter: MapFilterKey;
  searchExpanded: boolean;
  onSearchExpandedChange: (expanded: boolean) => void;
  onDesktopBrowseTabChange: (tab: DesktopBrowseTab) => void;
  panel: ExplorePanel;
  sidebarPanel: ExplorePanel;
  activityFilter: ActivityListFilterKey;
  venueFilter: VenueListFilterKey;
  browseFilterHint: string | null;
  onPanelChange: (panel: ExplorePanel) => void;
  onActivityFilterChange: (filter: ActivityListFilterKey) => void;
  onVenueFilterChange: (filter: VenueListFilterKey) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onQuerySync: () => void;
  onClearQuery: () => void;
  onClose: () => void;
  onOpenItem: (item: ExploreMapItemDTO) => void;
  onFocusMapLocation: (coords: { lat: number; lng: number }) => void;
}

/** Browse list chrome: tabs, search, filters, and scrollable results. */
export const ExploreBrowsePanel = ({
  isDesktop,
  loading,
  listItems,
  shopListSections,
  desktopBrowseTab,
  mapFilter,
  searchExpanded,
  onSearchExpandedChange,
  onDesktopBrowseTabChange,
  panel,
  sidebarPanel,
  activityFilter,
  venueFilter,
  browseFilterHint,
  onPanelChange,
  onActivityFilterChange,
  onVenueFilterChange,
  query,
  onQueryChange,
  onQuerySync,
  onClearQuery,
  onClose,
  onOpenItem,
  onFocusMapLocation,
}: ExploreBrowsePanelProps) => (
  <>
    <div className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-neutral-200 lg:hidden" />

    {isDesktop ? (
      <>
        <div className="mb-3 flex shrink-0 items-center gap-2 border-b border-neutral-200">
          <div className="flex min-w-0 flex-1">
            {DESKTOP_BROWSE_TABS.map((tab) => {
              const active = desktopBrowseTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onDesktopBrowseTabChange(tab.key)}
                  className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="flex shrink-0 items-center gap-1 pb-1">
            <button
              type="button"
              onClick={() => onSearchExpandedChange(!searchExpanded)}
              className={`rounded-full p-2 ${
                searchExpanded || query.trim()
                  ? 'bg-neutral-100 text-gray-900'
                  : 'text-gray-500 hover:bg-neutral-50'
              }`}
              aria-label={searchExpanded ? 'Close search' : 'Search'}
              aria-expanded={searchExpanded}
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-gray-500 hover:bg-neutral-50 hover:text-gray-800"
              aria-label="Collapse list panel"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        </div>
        {(searchExpanded || query.trim()) && (
          <label className="mb-3 flex shrink-0 items-center gap-2 rounded-2xl bg-neutral-100 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onBlur={onQuerySync}
              placeholder={desktopSearchPlaceholder(desktopBrowseTab)}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              autoFocus
            />
            {query.trim() ? (
              <button
                type="button"
                onClick={onClearQuery}
                className="shrink-0 rounded-full p-0.5 text-gray-500 hover:text-gray-700"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>
        )}
        <h2 className="mb-3 shrink-0 text-lg font-bold text-gray-900 lg:text-xl">
          {desktopBrowseListTitle(desktopBrowseTab, listItems.length, mapFilter)}
        </h2>
      </>
    ) : (
      <>
        <div className="mb-4 flex shrink-0 items-start justify-between gap-3 border-b border-neutral-200/80 pb-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              {panelListTitle(sidebarPanel, listItems.length, activityFilter, venueFilter)}
            </h2>
            <p className="mt-0.5 text-xs font-medium text-gray-500">
              {listItems.length === 1 ? '1 result' : `${listItems.length} results`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm ring-1 ring-neutral-200/80"
            aria-label="Close browse panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-3 flex shrink-0 gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {PANEL_TABS.map((tab) => {
            const active = panel === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onPanelChange(tab.key)}
                className={`inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-sm font-semibold shadow-sm transition ${
                  active
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : 'bg-white text-gray-700 ring-1 ring-neutral-200/80'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        {browseFilterHint && (
          <p className="mb-3 shrink-0 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs leading-relaxed text-emerald-900">
            {browseFilterHint}
          </p>
        )}
        <label className="mb-3 flex shrink-0 items-center gap-2 rounded-2xl border border-neutral-200/80 bg-white px-3 py-2.5 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onBlur={onQuerySync}
            placeholder={panelSearchPlaceholder(sidebarPanel)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
        </label>
        {sidebarPanel === 'venues' && (
          <div className="mb-3 shrink-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Filter list</p>
            <div className="flex flex-wrap gap-2">
              {VENUE_LIST_FILTERS.map((option) => {
                const active = venueFilter === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => onVenueFilterChange(option.key)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
                      active ? exploreVenueListFilterActiveClass(option.key) : EXPLORE_LIST_FILTER_INACTIVE
                    }`}
                  >
                    <ExploreFilterIcon
                      filter={option.key === 'shop' ? 'shops' : option.key === 'all' ? 'all' : option.key}
                    />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {sidebarPanel === 'activities' && (
          <div className="mb-3 shrink-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Filter list</p>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_LIST_FILTERS.map((option) => {
                const active = activityFilter === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => onActivityFilterChange(option.key)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
                      active ? exploreActivityListFilterActiveClass(option.key) : EXPLORE_LIST_FILTER_INACTIVE
                    }`}
                  >
                    <ExploreFilterIcon filter={option.key} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </>
    )}

    <div className={`${EXPLORE_SHEET.browseList} lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-8`}>
      {loading && listItems.length === 0 ? (
        <ExploreListSkeleton rows={isDesktop ? 8 : 5} />
      ) : listItems.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">
          {browseListEmptyMessage({
            isDesktop,
            desktopBrowseTab,
            sidebarPanel,
            emptyFiltersCopy: PRODUCT_EXPLORE_EMPTY_FILTERS,
          })}
        </p>
      ) : null}
      {listItems.length > 0 && shopListSections ? (
        <>
          {shopListSections.physical.length > 0 && (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                On the map ({shopListSections.physical.length})
              </p>
              {shopListSections.physical.map((item) => (
                <ExploreListRow
                  key={item.id}
                  item={item}
                  card={buildExploreCardModel(item)}
                  onClick={() => onOpenItem(item)}
                  onFocusMapLocation={onFocusMapLocation}
                />
              ))}
            </>
          )}
          {shopListSections.online.length > 0 && (
            <>
              <p
                className={`mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 ${
                  shopListSections.physical.length > 0 ? 'mt-6' : ''
                }`}
              >
                Online partners ({shopListSections.online.length})
              </p>
              {shopListSections.online.map((item) => (
                <ExploreListRow
                  key={item.id}
                  item={item}
                  card={buildExploreCardModel(item)}
                  onClick={() => onOpenItem(item)}
                  onFocusMapLocation={onFocusMapLocation}
                />
              ))}
            </>
          )}
        </>
      ) : (
        listItems.map((item) => (
          <ExploreListRow
            key={item.id}
            item={item}
            card={buildExploreCardModel(item)}
            onClick={() => onOpenItem(item)}
            onFocusMapLocation={onFocusMapLocation}
          />
        ))
      )}
    </div>
  </>
);
