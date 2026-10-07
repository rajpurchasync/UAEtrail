import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { EXPLORE_SHEET, EXPLORE_TYPE } from '../../config/exploreTheme';
import type { ExplorePeopleBrowseTab } from './useExploreBrowseUrlState';
import { ExplorePeopleBrowsePanelTabs } from './ExplorePeopleBrowsePanelTabs';
import { ExploreFollowedSegmentTabs } from './ExploreFollowedSegmentTabs';
import { ExploreFollowedEntityList } from './ExploreFollowedEntityList';
import { ExploreMemberPeopleNetworkList } from './ExploreMemberPeopleNetworkList';
import { ExploreMemberDiscoveryList } from './ExploreMemberDiscoveryList';
import type { BuddiesDiscoverySegment } from '../../list/buddiesDiscoverySegment';
import { ListBuddiesCategoryToolbar } from '../../list/ui/ListBuddiesCategoryToolbar';
import {
  EXPLORE_PEOPLE_BROWSE_DISCOVER_SEARCH_PLACEHOLDER,
  EXPLORE_PEOPLE_BROWSE_PANEL_SUBCOPY,
  EXPLORE_PEOPLE_BROWSE_PANEL_TITLE,
  EXPLORE_PEOPLE_BROWSE_SEARCH_PLACEHOLDER,
} from '../../content/explorePeopleBrowseCopy';
import type {
  EntityFollowDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import type { UserRole } from '@uaetrail/shared-types';
import type { ExploreFollowedSegment } from './useExploreBrowseUrlState';

export interface ExplorePeopleBrowsePanelProps {
  isDesktop: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onQuerySync: () => void;
  onClose: () => void;
  closePanelAriaLabel?: string;
  closeButtonVariant?: 'collapse' | 'dismiss';
  searchFocusNonce?: number;
  peopleBrowseTab: ExplorePeopleBrowseTab;
  onPeopleBrowseTabChange: (tab: ExplorePeopleBrowseTab) => void;
  buddiesDiscoverSegment: BuddiesDiscoverySegment;
  onBuddiesDiscoverSegmentChange: (segment: BuddiesDiscoverySegment) => void;
  memberPeopleAllCount?: number;
  memberPeopleFriendsCount?: number;
  memberPeopleFollowedCount?: number;
  memberPeopleNetwork: SocialPersonRowDTO[];
  memberPeopleLoading: boolean;
  memberPeopleError: string | null;
  onRefreshMemberPeople: () => void;
  onOpenMemberPersonActivity?: (trip: { exploreItemId: string }) => void;
  discoveryFriendsGoing: SocialPersonRowDTO[];
  discoveryHostsGoing: SocialPersonRowDTO[];
  discoveryLookingFor: import('@uaetrail/shared-types').MemberDiscoveryLookingRowDTO[];
  discoveryFollowed: MemberBrowseCardDTO[];
  discoveryDirectory: MemberBrowseCardDTO[];
  discoveryQuota: MemberDiscoveryQuotaDTO | null;
  discoveryLoading: boolean;
  discoveryError: string | null;
  onOpenDiscoveryActivity?: (activityId: string) => void;
  onRefreshMemberDiscovery: () => void;
  followedSegment: ExploreFollowedSegment;
  onFollowedSegmentChange: (segment: ExploreFollowedSegment) => void;
  entityFollows: EntityFollowDTO[];
  entityFollowsLoading: boolean;
  entityFollowsError: string | null;
  isSignedIn: boolean;
  userRole?: UserRole;
  mobileSheetChrome?: boolean;
}

/** People browse on explore — member roster + discovery (map list uses `ListDiscoveryExperience`). */
export const ExplorePeopleBrowsePanel = ({
  isDesktop,
  query,
  onQueryChange,
  onQuerySync,
  onClose,
  closePanelAriaLabel = 'Close People',
  closeButtonVariant = 'dismiss',
  searchFocusNonce = 0,
  peopleBrowseTab,
  onPeopleBrowseTabChange,
  buddiesDiscoverSegment,
  onBuddiesDiscoverSegmentChange,
  memberPeopleAllCount,
  memberPeopleFriendsCount,
  memberPeopleFollowedCount,
  memberPeopleNetwork,
  memberPeopleLoading,
  memberPeopleError,
  onRefreshMemberPeople,
  onOpenMemberPersonActivity,
  discoveryFriendsGoing,
  discoveryHostsGoing,
  discoveryLookingFor,
  discoveryFollowed,
  discoveryDirectory,
  discoveryQuota,
  discoveryLoading,
  discoveryError,
  onOpenDiscoveryActivity,
  onRefreshMemberDiscovery,
  followedSegment,
  onFollowedSegmentChange,
  entityFollows,
  entityFollowsLoading,
  entityFollowsError,
  isSignedIn,
  userRole,
  mobileSheetChrome = false,
}: ExplorePeopleBrowsePanelProps) => {
  const mobileSheetPad = !isDesktop && mobileSheetChrome;
  const queryInputRef = useRef<HTMLInputElement>(null);
  const memberPeopleRosterTab = peopleBrowseTab === 'discover' ? 'all' : peopleBrowseTab;

  const memberPeopleNetworkFiltered =
    peopleBrowseTab !== 'discover'
      ? memberPeopleNetwork.filter((person) => {
          const q = query.trim().toLowerCase();
          if (!q) return true;
          return (
            person.displayName.toLowerCase().includes(q) ||
            (person.cityLabel?.toLowerCase().includes(q) ?? false) ||
            (person.upcomingTrip?.title.toLowerCase().includes(q) ?? false)
          );
        })
      : memberPeopleNetwork;

  useEffect(() => {
    if (!searchFocusNonce) return;
    queryInputRef.current?.focus();
  }, [searchFocusNonce]);

  const showMobileDismiss = !isDesktop || closeButtonVariant === 'dismiss';
  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      className={
        showMobileDismiss && !isDesktop
          ? 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 active:bg-neutral-100'
          : isDesktop
            ? 'rounded-full p-2 text-gray-500 hover:bg-neutral-50 hover:text-gray-800'
            : 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-neutral-100'
      }
      aria-label={closePanelAriaLabel}
    >
      <X className={showMobileDismiss && !isDesktop ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden />
    </button>
  );

  return (
    <div className={`flex min-h-0 flex-col overflow-hidden ${mobileSheetPad ? 'px-4' : ''}`}>
      <div className="mx-auto mb-2 h-1.5 w-10 shrink-0 rounded-full bg-neutral-200 lg:hidden" />

      <div
        className={`mb-2 shrink-0 flex flex-col gap-2 border-b border-neutral-200/80 pb-3 ${
          isDesktop ? 'border-neutral-200' : ''
        }`}
      >
        <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-1">
          <span className="w-10 shrink-0" aria-hidden />
          <h2 className="min-w-0 truncate text-center text-base font-bold text-gray-900">
            {EXPLORE_PEOPLE_BROWSE_PANEL_TITLE}
          </h2>
          <div className="flex justify-end">{closeButton}</div>
        </div>
        <p className="px-1 text-center text-xs leading-relaxed text-neutral-600">
          {EXPLORE_PEOPLE_BROWSE_PANEL_SUBCOPY}
        </p>
      </div>

      <ExplorePeopleBrowsePanelTabs
        tab={peopleBrowseTab}
        onTabChange={onPeopleBrowseTabChange}
        allCount={isSignedIn ? memberPeopleAllCount : undefined}
        friendsCount={isSignedIn ? memberPeopleFriendsCount : undefined}
        followedCount={isSignedIn ? memberPeopleFollowedCount : undefined}
      />

      {peopleBrowseTab === 'followed' ? (
        <ExploreFollowedSegmentTabs segment={followedSegment} onSegmentChange={onFollowedSegmentChange} />
      ) : null}

      <div
        className={
          isDesktop
            ? 'flex min-h-0 flex-1 flex-col overflow-visible'
            : mobileSheetChrome
              ? 'flex min-h-0 flex-col overflow-hidden'
              : 'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain'
        }
      >
        <div className="mb-2 flex shrink-0 items-stretch gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-neutral-200/80 bg-white px-3 py-2 shadow-sm">
            <input
              ref={queryInputRef}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onBlur={onQuerySync}
              placeholder={
                peopleBrowseTab === 'discover'
                  ? EXPLORE_PEOPLE_BROWSE_DISCOVER_SEARCH_PLACEHOLDER
                  : EXPLORE_PEOPLE_BROWSE_SEARCH_PLACEHOLDER
              }
              className={`min-w-0 flex-1 bg-transparent text-sm font-semibold ${EXPLORE_TYPE.title} outline-none placeholder:font-normal placeholder:text-neutral-500`}
            />
          </label>
        </div>

        <div
          className={`${EXPLORE_SHEET.browseList} ${mobileSheetPad ? '!px-0' : ''} ${
            isDesktop
              ? 'min-h-0 flex-1 overflow-y-auto lg:pb-8'
              : mobileSheetChrome
                ? 'min-h-0 max-h-[50dvh] overflow-y-auto overscroll-y-contain pb-[calc(var(--safe-bottom)+12px)]'
                : 'overflow-visible pb-[calc(var(--safe-bottom)+12px)]'
          }`}
        >
          {peopleBrowseTab === 'discover' ? (
            <div className="flex flex-col gap-2 px-3">
              <ListBuddiesCategoryToolbar
                segment={buddiesDiscoverSegment}
                onSegmentChange={onBuddiesDiscoverSegmentChange}
              />
              <ExploreMemberDiscoveryList
                segment={buddiesDiscoverSegment}
                friendsGoing={discoveryFriendsGoing}
                hostsGoing={discoveryHostsGoing}
                lookingFor={discoveryLookingFor}
                followed={discoveryFollowed}
                directory={discoveryDirectory}
                quota={discoveryQuota}
                loading={discoveryLoading}
                error={discoveryError}
                isSignedIn={isSignedIn}
                userRole={userRole}
                onRefresh={onRefreshMemberDiscovery}
                onOpenActivity={(activityId) => onOpenDiscoveryActivity?.(activityId)}
              />
            </div>
          ) : null}
          {peopleBrowseTab === 'followed' && followedSegment !== 'people' ? (
            <ExploreFollowedEntityList
              segment={followedSegment}
              follows={entityFollows}
              loading={entityFollowsLoading}
              error={entityFollowsError}
            />
          ) : null}
          {peopleBrowseTab !== 'discover' && !(peopleBrowseTab === 'followed' && followedSegment !== 'people') ? (
            <ExploreMemberPeopleNetworkList
              people={memberPeopleNetworkFiltered}
              loading={memberPeopleLoading}
              error={memberPeopleError}
              isSignedIn={isSignedIn}
              userRole={userRole}
              tab={memberPeopleRosterTab}
              onOpenActivity={(trip) => onOpenMemberPersonActivity?.(trip)}
              onRefresh={onRefreshMemberPeople}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
