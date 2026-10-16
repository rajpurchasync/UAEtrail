import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PanelLeftClose, Search, X, ChevronLeft } from 'lucide-react';
import type { ExploreCardModel } from '../exploreCardModel';
import type { AreaPublicDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { findPublishedAreaByQuery, isStrongPublishedAreaSearchMatch } from '../exploreAreaFilter';
import type { ExploreActivityModeFilter } from '../exploreActivityModeFilter';
import { PRODUCT_EXPLORE_EMPTY_FILTERS } from '../../content/productNorthStar';
import { planJoinedSchedulePath } from '../../config/routingCatalog';
import { EXPLORE_SHEET, EXPLORE_TYPE } from '../../config/exploreTheme';
import type { ExploreActivityDatePreset, ExplorePanel, MapFilterKey } from '../routing';
import { buildDiscoveryMapListRowCard } from '../../discovery';
import { ExploreBrowseFilterChrome } from './ExploreBrowseFilterChrome';
import { ExploreMapDateFilter } from './ExploreMapDateFilter';
import { VenueStateFilterMenu } from './VenueStateFilterMenu';
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
import {
  EXPLORE_SEARCH_PROMPT,
  type ExploreSearchScopeCounts,
  type ExploreSearchScopeKey,
} from '../exploreBrowseTaxonomy';
import { ExploreSearchAreaHints } from './ExploreSearchAreaHints';
import { ExploreSearchScopeHints } from './ExploreSearchScopeHints';
import type { ExploreBuddySubtypeKey } from '../exploreBuddySubtype';
import type { ExploreOutingTopicKey } from '../exploreOutingTopic';
import { ExploreMyPlanMapNotice } from './ExploreMyPlanMapNotice';
import { ListFeedPosterCard } from '../../list/ui/feed/ListFeedPosterCard';
import { LIST_FEED } from '../../list/listFeedTheme';
import { buildListFeedCards } from '../../list/buildListFeedCards';

export interface ExploreBrowsePanelProps {
  isDesktop: boolean;
  loading: boolean;
  listItems: ExploreMapItemDTO[];
  /** Full explore map pool for linked rideshare + card enrichment (defaults to `listItems`). */
  mapPool?: ExploreMapItemDTO[];
  shopListSections: ShopListSections | null;
  desktopBrowseTab: DesktopBrowseTab;
  mapFilter: MapFilterKey;
  browseFilterKeys: readonly MapFilterKey[];
  placesMode: boolean;
  onMapFilterChange: (filter: MapFilterKey) => void;
  activityDatePreset: ExploreActivityDatePreset;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  activityModeFilter?: ExploreActivityModeFilter;
  onActivityModeFilterChange?: (filter: ExploreActivityModeFilter) => void;
  publishedAreas?: AreaPublicDTO[];
  onPickArea?: (slug: string) => void;
  venueRegions: string[];
  onVenueRegionsChange: (regions: string[]) => void;
  onDesktopBrowseTabChange: (tab: DesktopBrowseTab) => void;
  panel: ExplorePanel;
  sidebarPanel: ExplorePanel;
  onPanelChange: (panel: ExplorePanel) => void;
  buddySubtype?: ExploreBuddySubtypeKey;
  onBuddySubtypeChange?: (subtype: ExploreBuddySubtypeKey) => void;
  outingTopic?: ExploreOutingTopicKey;
  onOutingTopicChange?: (topic: ExploreOutingTopicKey) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onQuerySync: () => void;
  onClearQuery: () => void;
  onClose: () => void;
  closePanelAriaLabel?: string;
  /** Desktop left browse: collapse chevron; Who's going right: dismiss (X). */
  closeButtonVariant?: 'collapse' | 'dismiss';
  onListItemHover?: (itemId: string) => void;
  onListItemHoverEnd?: () => void;
  onOpenItem: (item: ExploreMapItemDTO) => void;
  searchScopeCounts: ExploreSearchScopeCounts;
  onSearchScopePick: (scope?: ExploreSearchScopeKey | null) => void;
  searchFocusNonce?: number;
  /** Highlight buddy-hosted outings in map-aligned list rows. */
  buddyUserIds?: Set<string>;
  /** Filtered explore: only member activities + wishlist pins (`myPlan=1`). */
  myPlanMapMode?: boolean;
  /** Full-screen mobile browse — poster cards instead of compact rows. */
  usePosterFeed?: boolean;
  posterFeedCards?: ExploreCardModel[];
  /** Full-viewport browse modal (back affordance, no sheet handle). */
  fullscreenBrowse?: boolean;
  /** Mobile map sheet — horizontal inset for chrome + lists (People browse panel). */
  mobileSheetChrome?: boolean;
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

/** Browse list — Activities/Places tabs, filters, calendar; map uses separate topic pills. */
export const ExploreBrowsePanel = ({
  isDesktop,
  loading,
  listItems,
  mapPool: mapPoolProp,
  shopListSections,
  desktopBrowseTab,
  mapFilter,
  browseFilterKeys,
  placesMode,
  onMapFilterChange,
  activityDatePreset,
  onActivityDatePresetChange,
  activityModeFilter = 'all',
  onActivityModeFilterChange,
  publishedAreas = [],
  onPickArea,
  venueRegions,
  onVenueRegionsChange,
  onDesktopBrowseTabChange,
  panel,
  sidebarPanel,
  onPanelChange,
  buddySubtype = 'all',
  onBuddySubtypeChange,
  outingTopic = 'all',
  onOutingTopicChange,
  query,
  onQueryChange,
  onQuerySync,
  onClearQuery,
  onClose,
  closePanelAriaLabel,
  closeButtonVariant = 'collapse',
  onListItemHover,
  onListItemHoverEnd,
  onOpenItem,
  searchScopeCounts,
  onSearchScopePick,
  searchFocusNonce = 0,
  buddyUserIds,
  myPlanMapMode = false,
  usePosterFeed = false,
  posterFeedCards = [],
  fullscreenBrowse = false,
  mobileSheetChrome = false,
}: ExploreBrowsePanelProps) => {
  const mapPool = mapPoolProp ?? listItems;
  const mobileSheetPad = !isDesktop && (mobileSheetChrome || fullscreenBrowse);
  const sheetFillsViewport = fullscreenBrowse && !isDesktop;
  const listRowCardById = useMemo(() => {
    const map = new Map<string, ExploreCardModel>();
    for (const item of listItems) {
      map.set(item.id, buildDiscoveryMapListRowCard(item, mapPool));
    }
    return map;
  }, [listItems, mapPool]);
  const posterFeedBuiltCards = useMemo(
    () => (usePosterFeed ? buildListFeedCards(listItems, undefined, mapPool) : []),
    [usePosterFeed, listItems, mapPool]
  );
  const posterCardsToRender =
    posterFeedCards.length > 0 ? posterFeedCards : posterFeedBuiltCards;
  const heading = myPlanMapMode
    ? `Your plan (${listItems.length})`
    : listHeading(isDesktop, desktopBrowseTab, sidebarPanel, listItems.length, mapFilter);
  const filterEmojiContext = placesMode ? 'venue' : 'activity';
  const queryInputRef = useRef<HTMLInputElement>(null);
  const searchScopeAnchorRef = useRef<HTMLDivElement>(null);
  const [searchScopeOpen, setSearchScopeOpen] = useState(false);
  const hasSearchQuery = query.trim().length > 0;
  const showSearchScopeOverlay = searchScopeOpen && hasSearchQuery;

  useEffect(() => {
    if (!searchFocusNonce) return;
    queryInputRef.current?.focus();
  }, [searchFocusNonce]);

  useEffect(() => {
    if (!searchScopeOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!searchScopeAnchorRef.current?.contains(event.target as Node)) {
        setSearchScopeOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSearchScopeOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [searchScopeOpen]);

  useEffect(() => {
    if (!hasSearchQuery) setSearchScopeOpen(false);
  }, [hasSearchQuery]);

  const handleSearchQueryChange = (value: string) => {
    onQueryChange(value);
    if (value.trim().length > 0) setSearchScopeOpen(true);
  };

  const handleSearchScopePick = (scope?: ExploreSearchScopeKey | null) => {
    setSearchScopeOpen(false);
    onSearchScopePick(scope);
  };

  const showMobileDismiss = !isDesktop && closeButtonVariant === 'dismiss';
  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      className={
        showMobileDismiss
          ? 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 active:bg-neutral-100'
          : sheetFillsViewport
            ? 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 active:bg-neutral-100'
            : isDesktop
              ? 'rounded-full p-2 text-gray-500 hover:bg-neutral-50 hover:text-gray-800'
              : 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-neutral-100'
      }
      aria-label={
        closePanelAriaLabel ??
        (sheetFillsViewport
          ? 'Back to map'
          : isDesktop
            ? 'Collapse list panel'
            : 'Close browse panel')
      }
    >
      {sheetFillsViewport ? (
        <ChevronLeft className="h-6 w-6" aria-hidden />
      ) : isDesktop && closeButtonVariant === 'collapse' ? (
        <PanelLeftClose className="h-4 w-4" />
      ) : (
        <X className={showMobileDismiss ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden />
      )}
    </button>
  );

  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden ${sheetFillsViewport || !isDesktop ? 'flex-1' : ''} ${mobileSheetPad ? 'px-4' : ''}`}
    >
      {!fullscreenBrowse ? (
        <div className="mx-auto mb-2 h-1.5 w-10 shrink-0 rounded-full bg-neutral-200 lg:hidden" />
      ) : null}

      {myPlanMapMode ? <ExploreMyPlanMapNotice /> : null}

      {fullscreenBrowse && !isDesktop ? (
        <div className="shrink-0 border-b border-neutral-200/70 px-2 pb-2 pt-1">
          <div className="flex items-center gap-1">
            {closeButton}
            <h2 className="min-w-0 flex-1 truncate text-base font-bold tracking-tight text-neutral-900">
              {EXPLORE_SEARCH_PROMPT}
            </h2>
          </div>
        </div>
      ) : (
        <div
          className={`mb-2 flex shrink-0 flex-col gap-2 ${
            isDesktop ? 'border-b border-neutral-200 pb-0' : 'pb-0'
          }`}
        >
          {!isDesktop && !myPlanMapMode ? (
            <div className="flex items-start justify-between gap-2">
              <h2 className={`min-w-0 flex-1 text-base font-bold tracking-tight ${EXPLORE_TYPE.title}`}>
                {EXPLORE_SEARCH_PROMPT}
              </h2>
              {closeButton}
            </div>
          ) : null}
          <div className="flex min-w-0 items-start justify-between gap-2">
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
                  <div className="flex shrink-0 items-center gap-1 pb-1">{closeButton}</div>
                </div>
              ) : (
                <div className="flex min-w-0 items-center gap-2 border-b border-neutral-200">
                  <div className="flex min-w-0 flex-1">
                    {PANEL_TABS.map((tab) => {
                      const active = panel === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => onPanelChange(tab.key)}
                          className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition [-webkit-tap-highlight-color:transparent] ${
                            active
                              ? 'border-emerald-600 text-emerald-700'
                              : 'border-transparent text-gray-500 active:text-gray-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                  {myPlanMapMode ? (
                    <div className="flex shrink-0 items-center gap-1 pb-1">{closeButton}</div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isDesktop ? (
        <h2 className="mb-2 shrink-0 text-lg font-bold text-gray-900 lg:text-xl">{heading}</h2>
      ) : null}

      <div
        className={
          isDesktop
            ? 'flex min-h-0 flex-1 flex-col overflow-visible'
            : sheetFillsViewport
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
              : 'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain'
        }
      >
          <div
            ref={searchScopeAnchorRef}
            className={`relative mb-2 shrink-0 ${fullscreenBrowse && !isDesktop ? 'px-3' : ''}`}
          >
            <div className="flex items-stretch gap-2">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-neutral-200/80 bg-white px-3 py-2 shadow-sm lg:rounded-2xl lg:bg-neutral-100 lg:py-2.5 lg:shadow-none">
                <Search className="h-4 w-4 shrink-0 text-gray-400" />
                <input
                  ref={queryInputRef}
                  value={query}
                  onChange={(event) => handleSearchQueryChange(event.target.value)}
                  onFocus={() => {
                    if (hasSearchQuery) setSearchScopeOpen(true);
                  }}
                  onBlur={onQuerySync}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      const area = findPublishedAreaByQuery(publishedAreas, query);
                      if (area && onPickArea && isStrongPublishedAreaSearchMatch(area, query)) {
                        onPickArea(area.slug);
                        return;
                      }
                      handleSearchScopePick(null);
                    }
                  }}
                  placeholder={searchPlaceholder(isDesktop, desktopBrowseTab, sidebarPanel)}
                  className={`min-w-0 flex-1 bg-transparent text-sm font-semibold ${EXPLORE_TYPE.title} outline-none placeholder:font-normal placeholder:text-neutral-500`}
                  aria-expanded={showSearchScopeOverlay}
                  aria-haspopup="listbox"
                />
                {query.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClearQuery();
                      setSearchScopeOpen(false);
                    }}
                    className="shrink-0 rounded-full p-0.5 text-gray-500 hover:text-gray-700"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </label>
              {!placesMode && !isDesktop ? (
                <ExploreMapDateFilter
                  activityDatePreset={activityDatePreset}
                  onActivityDatePresetChange={onActivityDatePresetChange}
                  iconOnly
                />
              ) : null}
              {placesMode ? (
                <VenueStateFilterMenu
                  selected={venueRegions}
                  onChange={onVenueRegionsChange}
                  toolbarTrigger
                />
              ) : null}
            </div>
            {showSearchScopeOverlay ? (
              <div
                className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-neutral-200/90 bg-white shadow-[0_12px_40px_rgba(15,23,42,.18)]"
                role="presentation"
                onMouseDown={(event) => event.preventDefault()}
              >
                {onPickArea ? (
                  <ExploreSearchAreaHints
                    query={query}
                    areas={publishedAreas}
                    onPick={(slug) => {
                      onPickArea(slug);
                      setSearchScopeOpen(false);
                    }}
                  />
                ) : null}
                <ExploreSearchScopeHints
                  query={query}
                  counts={searchScopeCounts}
                  onPick={(scope) => handleSearchScopePick(scope)}
                />
              </div>
            ) : null}
          </div>

          <ExploreBrowseFilterChrome
            mapFilter={mapFilter}
            onMapFilterChange={onMapFilterChange}
            allowedKeys={browseFilterKeys}
            filterEmojiContext={filterEmojiContext}
            layout="list"
            showDateFilter={false}
            activityDatePreset={activityDatePreset}
            onActivityDatePresetChange={onActivityDatePresetChange}
            showStateFilter={false}
            venueRegions={venueRegions}
            onVenueRegionsChange={onVenueRegionsChange}
            buddySubtype={buddySubtype}
            onBuddySubtypeChange={onBuddySubtypeChange}
            outingTopic={outingTopic}
            onOutingTopicChange={onOutingTopicChange}
            activityModeFilter={activityModeFilter}
            onActivityModeFilterChange={onActivityModeFilterChange}
            className={`mb-2 shrink-0 ${fullscreenBrowse && !isDesktop ? 'px-3' : ''}`}
          />

        <div
          className={`${EXPLORE_SHEET.browseList} ${
            isDesktop
              ? 'min-h-0 flex-1 overflow-y-auto lg:pb-8'
              : sheetFillsViewport
                ? 'min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-4'
                : 'overflow-visible pb-[calc(var(--safe-bottom)+12px)]'
          }`}
          onMouseLeave={onListItemHoverEnd}
        >
          {loading && listItems.length === 0 ? (
            <ExploreListSkeleton rows={isDesktop ? 8 : 5} />
          ) : null}
          {!loading && listItems.length === 0 ? (
            myPlanMapMode ? (
              <div className={`py-10 text-center text-sm ${EXPLORE_TYPE.muted}`}>
                <p className="font-medium text-neutral-700">Nothing on your map yet</p>
                <p className="mt-1">Join an outing or follow a place on explore.</p>
                <Link
                  to={planJoinedSchedulePath()}
                  className="mt-3 inline-block font-semibold text-emerald-700"
                >
                  Open trip list
                </Link>
              </div>
            ) : (
              <p className={`py-10 text-center text-sm font-medium ${EXPLORE_TYPE.muted}`}>
                {browseListEmptyMessage({
                      isDesktop,
                      desktopBrowseTab,
                      sidebarPanel,
                      emptyFiltersCopy: PRODUCT_EXPLORE_EMPTY_FILTERS,
                    })}
              </p>
            )
          ) : null}
          {listItems.length > 0 && shopListSections && !usePosterFeed ? (
            <>
              {shopListSections.physical.length > 0 && (
                <>
                  <p className={`mb-2 text-xs font-bold uppercase tracking-wide ${EXPLORE_TYPE.muted}`}>
                    On the map ({shopListSections.physical.length})
                  </p>
                  {shopListSections.physical.map((item) => (
                    <ExploreListRow
                      key={item.id}
                      card={listRowCardById.get(item.id)!}
                      onClick={() => onOpenItem(item)}
                      onPointerEnter={onListItemHover ? () => onListItemHover(item.id) : undefined}
                    />
                  ))}
                </>
              )}
              {shopListSections.online.length > 0 && (
                <>
                  <p
                    className={`mb-2 text-xs font-bold uppercase tracking-wide ${EXPLORE_TYPE.muted} ${
                      shopListSections.physical.length > 0 ? 'mt-6' : ''
                    }`}
                  >
                    Online partners ({shopListSections.online.length})
                  </p>
                  {shopListSections.online.map((item) => (
                    <ExploreListRow
                      key={item.id}
                      card={listRowCardById.get(item.id)!}
                      onClick={() => onOpenItem(item)}
                      onPointerEnter={onListItemHover ? () => onListItemHover(item.id) : undefined}
                    />
                  ))}
                </>
              )}
            </>
          ) : usePosterFeed && posterCardsToRender.length > 0 ? (
              <ul className={LIST_FEED.categoryList}>
                {posterCardsToRender.map((card) => (
                  <li key={card.id}>
                    <ListFeedPosterCard card={card} />
                  </li>
                ))}
              </ul>
            ) : (
              listItems.map((item) => (
                <ExploreListRow
                  key={item.id}
                  card={listRowCardById.get(item.id)!}
                  onClick={() => onOpenItem(item)}
                  buddyUserIds={buddyUserIds}
                  onPointerEnter={onListItemHover ? () => onListItemHover(item.id) : undefined}
                />
              ))
            )}
        </div>
      </div>
    </div>
  );
};
