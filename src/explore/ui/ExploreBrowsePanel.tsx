import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PanelLeftClose, Search, X, ChevronLeft } from 'lucide-react';
import type { ExploreCardModel } from '../exploreCardModel';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { PRODUCT_EXPLORE_EMPTY_FILTERS } from '../../content/productNorthStar';
import { tripsLegacyJoinedTabPath } from '../../config/routingCatalog';
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
import type { ExploreBrowseListMode, ExploreSocialTab } from './useExploreBrowseUrlState';
import { ExploreSocialPanelTabs } from './ExploreSocialPanelTabs';
import { ExploreFollowedSegmentTabs } from './ExploreFollowedSegmentTabs';
import { ExploreFollowedEntityList } from './ExploreFollowedEntityList';
import { ExploreSocialPeopleList } from './ExploreSocialPeopleList';
import { ExploreMemberDiscoveryList } from './ExploreMemberDiscoveryList';
import {
  EXPLORE_SOCIAL_DISCOVER_SEARCH_PLACEHOLDER,
  EXPLORE_SOCIAL_PANEL_SUBCOPY,
  EXPLORE_SOCIAL_PANEL_TITLE,
  EXPLORE_SOCIAL_SEARCH_PLACEHOLDER,
} from '../../content/exploreSocialPanelCopy';
import type {
  MemberBrowseCardDTO,
  MemberDiscoveryOnTripRowDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import type { UserRole } from '@uaetrail/shared-types';
import type { ExploreBuddySubtypeKey } from '../exploreBuddySubtype';
import type { ExploreOutingTopicKey } from '../exploreOutingTopic';
import { ExploreMyTripsModeNotice } from './ExploreMyTripsModeNotice';
import { ListFeedPosterCard } from '../../list/ui/feed/ListFeedPosterCard';
import { LIST_FEED } from '../../list/listFeedTheme';

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
  socialTab?: ExploreSocialTab;
  onSocialTabChange?: (tab: ExploreSocialTab) => void;
  socialAllCount?: number;
  socialFriendsCount?: number;
  socialFollowedCount?: number;
  socialPeople?: SocialPersonRowDTO[];
  socialLoading?: boolean;
  socialError?: string | null;
  onRefreshSocialPeople?: () => void;
  onOpenSocialActivity?: (trip: { exploreItemId: string }) => void;
  discoveryOnTrips?: MemberDiscoveryOnTripRowDTO[];
  discoveryDirectory?: MemberBrowseCardDTO[];
  discoveryQuota?: MemberDiscoveryQuotaDTO | null;
  discoveryLoading?: boolean;
  discoveryError?: string | null;
  onOpenDiscoveryActivity?: (activityId: string) => void;
  followedSegment?: import('./useExploreBrowseUrlState').ExploreFollowedSegment;
  onFollowedSegmentChange?: (segment: import('./useExploreBrowseUrlState').ExploreFollowedSegment) => void;
  entityFollows?: import('@uaetrail/shared-types').EntityFollowDTO[];
  entityFollowsLoading?: boolean;
  entityFollowsError?: string | null;
  isSignedIn?: boolean;
  userRole?: UserRole;
  buddyUserIds?: Set<string>;
  /** Filtered explore: only member trips + wishlist pins (`myTrips=1`). */
  myTripsMode?: boolean;
  /** Full-screen mobile browse — poster cards instead of compact rows. */
  usePosterFeed?: boolean;
  posterFeedCards?: ExploreCardModel[];
  /** Full-viewport browse modal (back affordance, no sheet handle). */
  fullscreenBrowse?: boolean;
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
  socialTab = 'all',
  onSocialTabChange,
  socialAllCount,
  socialFriendsCount,
  socialFollowedCount,
  socialPeople = [],
  socialLoading = false,
  socialError = null,
  onRefreshSocialPeople,
  onOpenSocialActivity,
  discoveryOnTrips = [],
  discoveryDirectory = [],
  discoveryQuota = null,
  discoveryLoading = false,
  discoveryError = null,
  onOpenDiscoveryActivity,
  followedSegment = 'people',
  onFollowedSegmentChange,
  entityFollows = [],
  entityFollowsLoading = false,
  entityFollowsError = null,
  isSignedIn = false,
  userRole,
  buddyUserIds,
  myTripsMode = false,
  usePosterFeed = false,
  posterFeedCards = [],
  fullscreenBrowse = false,
}: ExploreBrowsePanelProps) => {
  const socialPanel = listMode === 'social';
  const heading = socialPanel
    ? EXPLORE_SOCIAL_PANEL_TITLE
    : myTripsMode
      ? `My trips (${listItems.length})`
      : listHeading(isDesktop, desktopBrowseTab, sidebarPanel, listItems.length, mapFilter);
  const filterEmojiContext = placesMode ? 'venue' : 'activity';
  const queryInputRef = useRef<HTMLInputElement>(null);
  const searchScopeAnchorRef = useRef<HTMLDivElement>(null);
  const [searchScopeOpen, setSearchScopeOpen] = useState(false);
  const hasSearchQuery = query.trim().length > 0;
  const showSearchScopeOverlay = !socialPanel && searchScopeOpen && hasSearchQuery;

  const socialRosterTab = socialTab === 'discover' ? 'all' : socialTab;

  const socialPeopleFiltered = socialPanel && socialTab !== 'discover'
    ? socialPeople.filter((person) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          person.displayName.toLowerCase().includes(q) ||
          (person.cityLabel?.toLowerCase().includes(q) ?? false) ||
          (person.upcomingTrip?.title.toLowerCase().includes(q) ?? false)
        );
      })
    : socialPeople;

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
        fullscreenBrowse && !isDesktop
          ? 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 active:bg-neutral-100'
          : isDesktop
            ? 'rounded-full p-2 text-gray-500 hover:bg-neutral-50 hover:text-gray-800'
            : 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-neutral-100'
      }
      aria-label={
        closePanelAriaLabel ??
        (fullscreenBrowse && !isDesktop
          ? 'Back to map'
          : isDesktop
            ? 'Collapse list panel'
            : 'Close browse panel')
      }
    >
      {fullscreenBrowse && !isDesktop ? (
        <ChevronLeft className="h-6 w-6" aria-hidden />
      ) : isDesktop && closeButtonVariant === 'collapse' ? (
        <PanelLeftClose className="h-4 w-4" />
      ) : (
        <X className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {!fullscreenBrowse ? (
        <div className="mx-auto mb-2 h-1.5 w-10 shrink-0 rounded-full bg-neutral-200 lg:hidden" />
      ) : null}

      {myTripsMode ? <ExploreMyTripsModeNotice /> : null}

      {socialPanel ? (
        <div
          className={`mb-2 flex shrink-0 flex-col gap-1 ${
            isDesktop ? 'border-b border-neutral-200 pb-2' : 'border-b border-neutral-200/80 pb-2'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="min-w-0 truncate text-base font-bold text-gray-900">{heading}</h2>
            {closeButton}
          </div>
          <p className="text-xs leading-relaxed text-neutral-600">{EXPLORE_SOCIAL_PANEL_SUBCOPY}</p>
        </div>
      ) : fullscreenBrowse && !isDesktop ? (
        <div className="shrink-0 border-b border-neutral-200/70 px-2 pb-2 pt-1">
          <div className="flex items-center gap-1">
            {closeButton}
            <h2 className="min-w-0 flex-1 truncate text-base font-bold tracking-tight text-neutral-900">
              {heading}
            </h2>
          </div>
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

      {socialPanel && onSocialTabChange ? (
        <ExploreSocialPanelTabs
          tab={socialTab}
          onTabChange={onSocialTabChange}
          allCount={isSignedIn ? socialAllCount : undefined}
          friendsCount={isSignedIn ? socialFriendsCount : undefined}
          followedCount={isSignedIn ? socialFollowedCount : undefined}
        />
      ) : null}

      {socialPanel && socialTab === 'followed' && onFollowedSegmentChange ? (
        <ExploreFollowedSegmentTabs segment={followedSegment} onSegmentChange={onFollowedSegmentChange} />
      ) : null}

      {!socialPanel && isDesktop ? (
        <h2 className="mb-2 shrink-0 text-lg font-bold text-gray-900 lg:text-xl">{heading}</h2>
      ) : null}

      <div
        className={
          isDesktop
            ? 'flex min-h-0 flex-1 flex-col overflow-visible'
            : fullscreenBrowse
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
              : 'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain'
        }
      >
        {socialPanel ? (
          <div className="mb-2 flex shrink-0 items-stretch gap-2">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-neutral-200/80 bg-white px-3 py-2 shadow-sm">
              <input
                ref={queryInputRef}
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                onBlur={onQuerySync}
                placeholder={
                  socialTab === 'discover'
                    ? EXPLORE_SOCIAL_DISCOVER_SEARCH_PLACEHOLDER
                    : EXPLORE_SOCIAL_SEARCH_PLACEHOLDER
                }
                className={`min-w-0 flex-1 bg-transparent text-sm font-semibold ${EXPLORE_TYPE.title} outline-none placeholder:font-normal placeholder:text-neutral-500`}
              />
            </label>
            {socialTab === 'discover' ? (
              <ExploreMapDateFilter
                activityDatePreset={activityDatePreset}
                onActivityDatePresetChange={onActivityDatePresetChange}
                iconOnly
              />
            ) : null}
          </div>
        ) : (
          <div
            ref={searchScopeAnchorRef}
            className={`relative mb-2 shrink-0 ${fullscreenBrowse && !isDesktop ? 'px-3' : ''}`}
          >
            {fullscreenBrowse && !isDesktop ? null : (
              <p className={`mb-1.5 text-sm font-bold ${EXPLORE_TYPE.title} lg:hidden`}>{EXPLORE_SEARCH_PROMPT}</p>
            )}
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

        {!socialPanel ? (
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
            className={`mb-2 shrink-0 ${fullscreenBrowse && !isDesktop ? 'px-3' : ''}`}
          />
        ) : null}

        <div
          className={`${EXPLORE_SHEET.browseList} ${
            isDesktop
              ? 'min-h-0 flex-1 overflow-y-auto lg:pb-8'
              : fullscreenBrowse
                ? 'min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 pb-4'
                : 'overflow-visible pb-[calc(var(--safe-bottom)+12px)]'
          }`}
          onMouseLeave={onListItemHoverEnd}
        >
          {socialPanel && socialTab === 'discover' ? (
            <ExploreMemberDiscoveryList
              onTrips={discoveryOnTrips}
              directory={discoveryDirectory}
              quota={discoveryQuota}
              loading={discoveryLoading}
              error={discoveryError}
              isSignedIn={isSignedIn}
              onOpenActivity={(activityId) => onOpenDiscoveryActivity?.(activityId)}
            />
          ) : null}
          {socialPanel && socialTab === 'followed' && followedSegment !== 'people' ? (
            <ExploreFollowedEntityList
              segment={followedSegment}
              follows={entityFollows}
              loading={entityFollowsLoading}
              error={entityFollowsError}
            />
          ) : null}
          {socialPanel && socialTab !== 'discover' && !(socialTab === 'followed' && followedSegment !== 'people') ? (
            <ExploreSocialPeopleList
              people={socialPeopleFiltered}
              loading={socialLoading}
              error={socialError}
              isSignedIn={isSignedIn}
              userRole={userRole}
              tab={socialRosterTab}
              onOpenActivity={(trip) => onOpenSocialActivity?.(trip)}
              onRefresh={() => onRefreshSocialPeople?.()}
            />
          ) : null}
          {!socialPanel && loading && listItems.length === 0 ? (
            <ExploreListSkeleton rows={isDesktop ? 8 : 5} />
          ) : null}
          {!socialPanel && !loading && listItems.length === 0 ? (
            myTripsMode ? (
              <div className={`py-10 text-center text-sm ${EXPLORE_TYPE.muted}`}>
                <p className="font-medium text-neutral-700">Nothing on your map yet</p>
                <p className="mt-1">Join an outing or follow a place on explore.</p>
                <Link
                  to={tripsLegacyJoinedTabPath()}
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
          ) : !socialPanel ? (
            usePosterFeed && posterFeedCards.length > 0 ? (
              <ul className={LIST_FEED.categoryList}>
                {posterFeedCards.map((card) => (
                  <li key={card.id}>
                    <ListFeedPosterCard card={card} />
                  </li>
                ))}
              </ul>
            ) : (
              listItems.map((item) => (
                <ExploreListRow
                  key={item.id}
                  card={buildExploreCardModel(item)}
                  onClick={() => onOpenItem(item)}
                  buddyUserIds={buddyUserIds}
                  onPointerEnter={onListItemHover ? () => onListItemHover(item.id) : undefined}
                />
              ))
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};
