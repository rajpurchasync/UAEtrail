import { PanelLeftClose, Search, X } from 'lucide-react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { PRODUCT_EXPLORE_EMPTY_FILTERS } from '../../content/productNorthStar';
import { EXPLORE_SHEET } from '../../config/exploreTheme';
import type { ExplorePanel, MapFilterKey } from '../routing';
import { buildExploreCardModel } from '../exploreCardModel';
import { ExploreBrowseFilterChrome } from './ExploreBrowseFilterChrome';
import { ExploreMapDateFilter } from './ExploreMapDateFilter';
import { ExploreListRow } from './ExploreListRow';
import { ExploreListSkeleton } from './ExploreListSkeleton';
import {
  browseListEmptyMessage,
  DESKTOP_BROWSE_TABS,
  desktopBrowseListTitle,
  desktopSearchPlaceholder,
  type DesktopBrowseTab,
  panelListTitle,
  panelSearchPlaceholder,
  PANEL_TABS,
  type ShopListSections,
} from './exploreBrowsePanelCopy';

export interface ExploreBrowsePanelProps {
  isDesktop: boolean;
  loading: boolean;
  listItems: ExploreMapItemDTO[];
  shopListSections: ShopListSections | null;
  desktopBrowseTab: DesktopBrowseTab;
  mapFilter: MapFilterKey;
  browseFilterKeys: readonly MapFilterKey[];
  placesMode: boolean;
  onMapFilterChange: (filter: MapFilterKey) => void;
  activityDate: string | null;
  onActivityDateChange: (iso: string | null) => void;
  scheduledDates?: readonly string[];
  venueRegions: string[];
  onVenueRegionsChange: (regions: string[]) => void;
  onDesktopBrowseTabChange: (tab: DesktopBrowseTab) => void;
  panel: ExplorePanel;
  sidebarPanel: ExplorePanel;
  onPanelChange: (panel: ExplorePanel) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onQuerySync: () => void;
  onClearQuery: () => void;
  onClose: () => void;
  onOpenItem: (item: ExploreMapItemDTO) => void;
}

const listHeading = (
  isDesktop: boolean,
  desktopBrowseTab: DesktopBrowseTab,
  sidebarPanel: ExplorePanel,
  count: number,
  mapFilter: MapFilterKey
): string => {
  if (sidebarPanel === 'shops') return panelListTitle('shops', count, 'all', 'all');
  if (isDesktop) return desktopBrowseListTitle(desktopBrowseTab, count, mapFilter);
  const modeTab: DesktopBrowseTab = sidebarPanel === 'venues' ? 'venues' : 'activities';
  return desktopBrowseListTitle(modeTab, count, mapFilter);
};

const searchPlaceholder = (isDesktop: boolean, desktopBrowseTab: DesktopBrowseTab, sidebarPanel: ExplorePanel) =>
  isDesktop ? desktopSearchPlaceholder(desktopBrowseTab) : panelSearchPlaceholder(sidebarPanel);

/** Browse list chrome: tabs, search, filters (same as map), and scrollable results. */
export const ExploreBrowsePanel = ({
  isDesktop,
  loading,
  listItems,
  shopListSections,
  desktopBrowseTab,
  mapFilter,
  browseFilterKeys,
  placesMode,
  onMapFilterChange,
  activityDate,
  onActivityDateChange,
  scheduledDates,
  venueRegions,
  onVenueRegionsChange,
  onDesktopBrowseTabChange,
  panel,
  sidebarPanel,
  onPanelChange,
  query,
  onQueryChange,
  onQuerySync,
  onClearQuery,
  onClose,
  onOpenItem,
}: ExploreBrowsePanelProps) => {
  const heading = listHeading(isDesktop, desktopBrowseTab, sidebarPanel, listItems.length, mapFilter);
  const filterEmojiContext = placesMode ? 'venue' : 'activity';

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-neutral-200 lg:hidden" />

      <div
        className={`mb-3 flex shrink-0 items-start justify-between gap-3 ${
          isDesktop ? 'border-b border-neutral-200 pb-0' : 'border-b border-neutral-200/80 pb-3'
        }`}
      >
        <div className="min-w-0 flex-1">
          {isDesktop ? (
            <div className="flex min-w-0 items-center gap-2">
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
                  onClick={onClose}
                  className="rounded-full p-2 text-gray-500 hover:bg-neutral-50 hover:text-gray-800"
                  aria-label="Collapse list panel"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold tracking-tight text-gray-900">{heading}</h2>
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
              <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
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
            </>
          )}
        </div>
      </div>

      {isDesktop ? (
        <h2 className="mb-3 shrink-0 text-lg font-bold text-gray-900 lg:text-xl">{heading}</h2>
      ) : null}

      <div
        className={
          isDesktop
            ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
            : 'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain'
        }
      >
        <div className="mb-3 flex shrink-0 items-stretch gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-neutral-200/80 bg-white px-3 py-2.5 shadow-sm lg:rounded-2xl lg:bg-neutral-100 lg:shadow-none lg:ring-0">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onBlur={onQuerySync}
              placeholder={searchPlaceholder(isDesktop, desktopBrowseTab, sidebarPanel)}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
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
          {isDesktop && !placesMode ? (
            <ExploreMapDateFilter
              activityDate={activityDate}
              onActivityDateChange={onActivityDateChange}
              scheduledDates={scheduledDates}
            />
          ) : null}
        </div>

        <ExploreBrowseFilterChrome
          mapFilter={mapFilter}
          onMapFilterChange={onMapFilterChange}
          allowedKeys={browseFilterKeys}
          filterEmojiContext={filterEmojiContext}
          layout="list"
          showDateFilter={!placesMode && !isDesktop}
          activityDate={activityDate}
          onActivityDateChange={onActivityDateChange}
          scheduledDates={scheduledDates}
          showStateFilter={placesMode}
          venueRegions={venueRegions}
          onVenueRegionsChange={onVenueRegionsChange}
          className="mb-3 shrink-0"
        />

        <div
          className={`${EXPLORE_SHEET.browseList} ${
            isDesktop ? 'min-h-0 flex-1 overflow-y-auto lg:pb-8' : 'overflow-visible pb-[calc(var(--safe-bottom)+12px)]'
          }`}
        >
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
                    card={buildExploreCardModel(item)}
                    onClick={() => onOpenItem(item)}
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
                    card={buildExploreCardModel(item)}
                    onClick={() => onOpenItem(item)}
                  />
                ))}
              </>
            )}
          </>
        ) : (
          listItems.map((item) => (
            <ExploreListRow
              key={item.id}
              card={buildExploreCardModel(item)}
              onClick={() => onOpenItem(item)}
            />
          ))
        )}
        </div>
      </div>
    </div>
  );
};
