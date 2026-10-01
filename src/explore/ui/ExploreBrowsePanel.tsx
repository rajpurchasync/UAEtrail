import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PanelLeftClose, Search, X } from 'lucide-react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { PRODUCT_EXPLORE_EMPTY_FILTERS } from '../../content/productNorthStar';
import { EXPLORE_SHEET, EXPLORE_TYPE } from '../../config/exploreTheme';
import type { ExploreActivityDatePreset, ExplorePanel, MapFilterKey } from '../routing';
import { buildExploreCardModel } from '../exploreCardModel';
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
import { ExploreSearchScopeHints } from './ExploreSearchScopeHints';
import type { ExploreBrowseListMode, WhosGoingSegment } from './useExploreBrowseUrlState';
import { ExploreWhosGoingSegmentTabs } from './ExploreWhosGoingSegmentTabs';
import { ExploreWhosGoingPeopleList } from './ExploreWhosGoingPeopleList';
import type { WhosGoingFriendRow } from '../whosGoingFriends';
import type { UserRole } from '@uaetrail/shared-types';
import type { ExploreBuddySubtypeKey } from '../exploreBuddySubtype';
import type { ExploreOutingTopicKey } from '../exploreOutingTopic';
import { ExploreMyTripsModeNotice } from './ExploreMyTripsModeNotice';

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
  activityDatePreset: ExploreActivityDatePreset;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
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
  listMode?: ExploreBrowseListMode;
  whosGoingSegment?: WhosGoingSegment;
  onWhosGoingSegmentChange?: (segment: WhosGoingSegment) => void;
  whosGoingTripsCount?: number;
  whosGoingPeopleCount?: number;
  whosGoingFriendRows?: WhosGoingFriendRow[];
  whosGoingFriendsLoading?: boolean;
  whosGoingFriendsError?: string | null;
  isSignedIn?: boolean;
  userRole?: UserRole;
  friendUserIds?: Set<string>;
  /** Filtered explore: only member trips + wishlist pins (`myTrips=1`). */
  myTripsMode?: boolean;
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
  shopListSections,
  desktopBrowseTab,
  mapFilter,
  browseFilterKeys,
  placesMode,
  onMapFilterChange,
  activityDatePreset,
  onActivityDatePresetChange,
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
  listMode = 'default',
  whosGoingSegment = 'people',
  onWhosGoingSegmentChange,
  whosGoingTripsCount = 0,
  whosGoingPeopleCount = 0,
  whosGoingFriendRows = [],
  whosGoingFriendsLoading = false,
  whosGoingFriendsError = null,
  isSignedIn = false,
  userRole,
  friendUserIds,
  myTripsMode = false,
}: ExploreBrowsePanelProps) => {
  const whosGoing = listMode === 'whosGoing';
  const whosGoingTrips = whosGoing && whosGoingSegment === 'trips';
  const whosGoingPeople = whosGoing && whosGoingSegment === 'people';
  const heading = whosGoing
    ? "Who's going?"
    : myTripsMode
      ? `My trips (${listItems.length})`
      : listHeading(isDesktop, desktopBrowseTab, sidebarPanel, listItems.length, mapFilter);
  const filterEmojiContext = placesMode ? 'venue' : 'activity';
  const queryInputRef = useRef<HTMLInputElement>(null);
  const searchScopeAnchorRef = useRef<HTMLDivElement>(null);
  const [searchScopeOpen, setSearchScopeOpen] = useState(false);
  const hasSearchQuery = query.trim().length > 0;
  const showSearchScopeOverlay = !whosGoing && searchScopeOpen && hasSearchQuery;

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

  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      className={
        isDesktop
          ? 'rounded-full p-2 text-gray-500 hover:bg-neutral-50 hover:text-gray-800'
          : 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-neutral-100'
      }
      aria-label={
        closePanelAriaLabel ?? (isDesktop ? 'Collapse list panel' : 'Close browse panel')
      }
    >
      {isDesktop && closeButtonVariant === 'collapse' ? (
        <PanelLeftClose className="h-4 w-4" />
      ) : (
        <X className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mx-auto mb-2 h-1.5 w-10 shrink-0 rounded-full bg-neutral-200 lg:hidden" />

      {myTripsMode ? <ExploreMyTripsModeNotice /> : null}

      {whosGoing ? (
        <div
          className={`mb-2 flex shrink-0 items-center justify-between gap-2 ${
            isDesktop ? 'border-b border-neutral-200 pb-2' : 'border-b border-neutral-200/80 pb-2'
          }`}
        >
          <h2 className="min-w-0 truncate text-base font-bold text-gray-900">{heading}</h2>
          {closeButton}
        </div>
      ) : (
        <div
          className={`mb-2 flex shrink-0 items-start justify-between gap-2 ${
            isDesktop ? 'border-b border-neutral-200 pb-0' : 'border-b border-neutral-200/80 pb-2'
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
                <div className="flex shrink-0 items-center gap-1 pb-1">{closeButton}</div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="min-w-0 text-lg font-bold tracking-tight text-gray-900">{heading}</h2>
                  {closeButton}
                </div>
                <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
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
      )}

      {whosGoing && onWhosGoingSegmentChange ? (
        <ExploreWhosGoingSegmentTabs
          segment={whosGoingSegment}
          onSegmentChange={onWhosGoingSegmentChange}
          peopleCount={isSignedIn ? whosGoingPeopleCount : undefined}
          tripsCount={whosGoingTripsCount}
        />
      ) : null}

      {!whosGoing && isDesktop ? (
        <h2 className="mb-2 shrink-0 text-lg font-bold text-gray-900 lg:text-xl">{heading}</h2>
      ) : null}

      <div
        className={
          isDesktop
            ? 'flex min-h-0 flex-1 flex-col overflow-visible'
            : 'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain'
        }
      >
        {whosGoing ? (
          <label className="mb-2 flex shrink-0 items-center gap-2 rounded-xl border border-neutral-200/80 bg-white px-3 py-2 shadow-sm">
            <input
              ref={queryInputRef}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onBlur={onQuerySync}
              placeholder={whosGoingPeople ? 'Search friends or trips…' : 'Search outings…'}
              className={`min-w-0 flex-1 bg-transparent text-sm font-semibold ${EXPLORE_TYPE.title} outline-none placeholder:font-normal placeholder:text-neutral-500`}
            />
          </label>
        ) : (
          <div ref={searchScopeAnchorRef} className="relative mb-2 shrink-0">
            <p className={`mb-1.5 text-sm font-bold ${EXPLORE_TYPE.title} lg:hidden`}>{EXPLORE_SEARCH_PROMPT}</p>
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
              {!placesMode ? (
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
                <ExploreSearchScopeHints
                  counts={searchScopeCounts}
                  onPick={(scope) => handleSearchScopePick(scope)}
                />
              </div>
            ) : null}
          </div>
        )}

        {!whosGoing ? (
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
            className="mb-2 shrink-0"
          />
        ) : null}

        <div
          className={`${EXPLORE_SHEET.browseList} ${
            isDesktop ? 'min-h-0 flex-1 overflow-y-auto lg:pb-8' : 'overflow-visible pb-[calc(var(--safe-bottom)+12px)]'
          }`}
          onMouseLeave={onListItemHoverEnd}
        >
          {whosGoingPeople ? (
            <ExploreWhosGoingPeopleList
              rows={whosGoingFriendRows}
              loading={whosGoingFriendsLoading}
              error={whosGoingFriendsError}
              isSignedIn={isSignedIn}
              userRole={userRole}
              onOpenTrip={onOpenItem}
            />
          ) : null}
          {!whosGoingPeople && loading && listItems.length === 0 ? (
            <ExploreListSkeleton rows={isDesktop ? 8 : 5} />
          ) : null}
          {!whosGoingPeople && !loading && listItems.length === 0 ? (
            myTripsMode ? (
              <div className={`py-10 text-center text-sm ${EXPLORE_TYPE.muted}`}>
                <p className="font-medium text-neutral-700">Nothing on your map yet</p>
                <p className="mt-1">Join an outing or save a place from explore.</p>
                <Link
                  to="/trips?segment=upcoming&tab=joined"
                  className="mt-3 inline-block font-semibold text-emerald-700"
                >
                  Open trip list
                </Link>
              </div>
            ) : (
              <p className={`py-10 text-center text-sm font-medium ${EXPLORE_TYPE.muted}`}>
                {whosGoingTrips
                  ? 'No outings with people joining yet — check back soon.'
                  : browseListEmptyMessage({
                      isDesktop,
                      desktopBrowseTab,
                      sidebarPanel,
                      emptyFiltersCopy: PRODUCT_EXPLORE_EMPTY_FILTERS,
                    })}
              </p>
            )
          ) : null}
          {listItems.length > 0 && shopListSections ? (
            <>
              {shopListSections.physical.length > 0 && (
                <>
                  <p className={`mb-2 text-xs font-bold uppercase tracking-wide ${EXPLORE_TYPE.muted}`}>
                    On the map ({shopListSections.physical.length})
                  </p>
                  {shopListSections.physical.map((item) => (
                    <ExploreListRow
                      key={item.id}
                      card={buildExploreCardModel(item)}
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
                      card={buildExploreCardModel(item)}
                      onClick={() => onOpenItem(item)}
                      onPointerEnter={onListItemHover ? () => onListItemHover(item.id) : undefined}
                    />
                  ))}
                </>
              )}
            </>
          ) : !whosGoingPeople ? (
            listItems.map((item) => (
              <ExploreListRow
                key={item.id}
                card={buildExploreCardModel(item)}
                onClick={() => onOpenItem(item)}
                showJoining={whosGoingTrips}
                friendUserIds={friendUserIds}
                onPointerEnter={onListItemHover ? () => onListItemHover(item.id) : undefined}
              />
            ))
          ) : null}
        </div>
      </div>
    </div>
  );
};
