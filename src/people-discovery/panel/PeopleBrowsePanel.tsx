import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { EXPLORE_SHEET, EXPLORE_TYPE } from '../../config/exploreTheme';
import { EXPLORE_DESKTOP_BROWSE_RAIL_SCROLL_CLASS } from '../../explore/ui/exploreDesktopBrowseRailChrome';
import type { PeopleBrowseTab } from '../peopleBrowseTab';
import { PeopleBrowsePanelTabs } from './PeopleBrowsePanelTabs';
import type { ExploreAvailablePersonDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { EXPLORE_PEOPLE_BROWSE_PANEL_TITLE } from '../../content/explorePeopleBrowseCopy';
import type {
  MemberBrowseCardDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import type { UserRole } from '@uaetrail/shared-types';
import { PeopleBrowseSearchField, PeopleBrowseTabContent } from './peopleBrowse';

export interface PeopleBrowsePanelProps {
  isDesktop: boolean;
  embedded?: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onQuerySync: () => void;
  onClose: () => void;
  closePanelAriaLabel?: string;
  closeButtonVariant?: 'collapse' | 'dismiss';
  searchFocusNonce?: number;
  peopleBrowseTab: PeopleBrowseTab;
  onPeopleBrowseTabChange: (tab: PeopleBrowseTab) => void;
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
  discoverySeekingOnMap: import('@uaetrail/shared-types').MemberDiscoverySeekingRowDTO[];
  discoveryFollowed: MemberBrowseCardDTO[];
  discoveryDirectory: MemberBrowseCardDTO[];
  discoveryQuota: MemberDiscoveryQuotaDTO | null;
  discoveryLoading: boolean;
  discoveryError: string | null;
  onRefreshMemberDiscovery: () => void;
  availabilityPeople?: ExploreAvailablePersonDTO[];
  availabilityLoading?: boolean;
  availabilityError?: string | null;
  availabilityRange?: { from: string; to: string };
  onRefreshAvailability?: () => void;
  isSignedIn: boolean;
  userRole?: UserRole;
  canBrowseAllMembers?: boolean;
  mobileSheetChrome?: boolean;
  seekingActivities: ExploreMapItemDTO[];
  exploreCatalogItems: ExploreMapItemDTO[];
  exploreCatalogLoading: boolean;
  onOpenSeekingActivity: (item: ExploreMapItemDTO) => void;
  buddyUserIds?: Set<string>;
}

/**
 * Find your crew — map sheet + list Buddies (`embedded`).
 * List body: `peopleBrowse/PeopleBrowseTabContent` (same rows as map plan list).
 */
export const PeopleBrowsePanel = ({
  isDesktop,
  embedded = false,
  query,
  onQueryChange,
  onQuerySync,
  onClose,
  closePanelAriaLabel = 'Close People',
  closeButtonVariant = 'dismiss',
  searchFocusNonce = 0,
  peopleBrowseTab,
  onPeopleBrowseTabChange,
  discoveryFriendsGoing,
  discoveryHostsGoing,
  discoverySeekingOnMap: _discoverySeekingOnMap,
  discoveryDirectory,
  discoveryQuota,
  discoveryLoading,
  discoveryError,
  availabilityPeople = [],
  availabilityLoading = false,
  availabilityError = null,
  isSignedIn,
  mobileSheetChrome = false,
  seekingActivities,
  exploreCatalogItems,
  exploreCatalogLoading,
  onOpenSeekingActivity,
  buddyUserIds,
}: PeopleBrowsePanelProps) => {
  const mobileSheetPad = !isDesktop && mobileSheetChrome && !embedded;
  const queryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchFocusNonce) return;
    queryInputRef.current?.focus();
  }, [searchFocusNonce]);

  const showMobileDismiss =
    !embedded && !mobileSheetChrome && (!isDesktop || closeButtonVariant === 'dismiss');
  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      className={
        showMobileDismiss && !isDesktop
          ? 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 active:bg-neutral-100'
          : isDesktop
            ? 'rounded-full bg-neutral-100 p-2 text-neutral-600 shadow-sm ring-1 ring-black/5 hover:bg-neutral-200 hover:text-neutral-800'
            : 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
      }
      aria-label={closePanelAriaLabel}
    >
      <X className={showMobileDismiss && !isDesktop ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden />
    </button>
  );

  const chromePad = embedded ? 'px-4' : mobileSheetPad ? 'px-4' : 'px-3';

  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden ${
        embedded ? 'min-h-[50vh] flex-1' : mobileSheetChrome ? 'min-h-0 flex-1' : ''
      }`}
    >
      {!embedded && !mobileSheetChrome ? (
        <div className="mx-auto mb-2 h-1.5 w-10 shrink-0 rounded-full bg-neutral-200 lg:hidden" aria-hidden />
      ) : null}

      {!embedded && !mobileSheetChrome ? (
        <div
          className={`mb-2 shrink-0 flex flex-col gap-2 border-b border-neutral-200/80 pb-3 ${chromePad} ${
            isDesktop ? 'border-neutral-200' : ''
          }`}
        >
          <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-1">
            <span className="w-10 shrink-0" aria-hidden />
            <h2 className={`min-w-0 truncate text-center text-base font-bold ${EXPLORE_TYPE.title}`}>
              {EXPLORE_PEOPLE_BROWSE_PANEL_TITLE}
            </h2>
            <div className="flex justify-end">{closeButton}</div>
          </div>
        </div>
      ) : null}

      <div className={chromePad}>
        <PeopleBrowseSearchField
          query={query}
          onQueryChange={onQueryChange}
          onQuerySync={onQuerySync}
          inputRef={queryInputRef}
        />
        <PeopleBrowsePanelTabs tab={peopleBrowseTab} onTabChange={onPeopleBrowseTabChange} />
      </div>

      <div
        className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain ${
          isDesktop
            ? `${EXPLORE_DESKTOP_BROWSE_RAIL_SCROLL_CLASS} explore-browse-rail-scroll w-full min-w-0 ${embedded ? `${chromePad} pr-1.5 pb-4` : 'px-1 pb-4'}`
            : embedded
              ? `${chromePad} pb-4`
              : `${EXPLORE_SHEET.browseList} lg:pb-8`
        }`}
      >
        <PeopleBrowseTabContent
          tab={peopleBrowseTab}
          isSignedIn={isSignedIn}
          seekingActivities={seekingActivities}
          exploreCatalogItems={exploreCatalogItems}
          exploreCatalogLoading={exploreCatalogLoading}
          onOpenSeekingActivity={onOpenSeekingActivity}
          buddyUserIds={buddyUserIds}
          availabilityPeople={availabilityPeople}
          availabilityLoading={availabilityLoading}
          availabilityError={availabilityError}
          friendsGoing={discoveryFriendsGoing}
          hostsGoing={discoveryHostsGoing}
          directory={discoveryDirectory}
          discoveryQuota={discoveryQuota}
          discoveryLoading={discoveryLoading}
          discoveryError={discoveryError}
        />
      </div>
    </div>
  );
};
