import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { EXPLORE_SHEET, EXPLORE_TYPE } from '../../config/exploreTheme';
import type { PeopleBrowseTab } from '../peopleBrowseTab';
import { PeopleBrowsePanelTabs } from './PeopleBrowsePanelTabs';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import type { ExploreAvailablePersonDTO } from '@uaetrail/shared-types';
import type { BuddiesDiscoverySegment } from '../../list/buddiesDiscoverySegment';
import { EXPLORE_PEOPLE_BROWSE_PANEL_TITLE } from '../../content/explorePeopleBrowseCopy';
import type {
  EntityFollowDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import type { UserRole } from '@uaetrail/shared-types';
import type { ExploreFollowedSegment } from './useExploreBrowseUrlState';
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
  activityDatePreset: ExploreActivityDatePreset;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
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
  availabilityPeople?: ExploreAvailablePersonDTO[];
  availabilityLoading?: boolean;
  availabilityError?: string | null;
  availabilityRange?: { from: string; to: string };
  onRefreshAvailability?: () => void;
  followedSegment: ExploreFollowedSegment;
  onFollowedSegmentChange: (segment: ExploreFollowedSegment) => void;
  entityFollows: EntityFollowDTO[];
  entityFollowsLoading: boolean;
  entityFollowsError: string | null;
  isSignedIn: boolean;
  userRole?: UserRole;
  canBrowseAllMembers?: boolean;
  mobileSheetChrome?: boolean;
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
  activityDatePreset,
  onActivityDatePresetChange,
  discoveryFriendsGoing,
  discoveryHostsGoing,
  discoveryDirectory,
  discoveryQuota,
  discoveryLoading,
  discoveryError,
  availabilityPeople = [],
  availabilityLoading = false,
  availabilityError = null,
  isSignedIn,
  mobileSheetChrome = false,
}: PeopleBrowsePanelProps) => {
  const mobileSheetPad = !isDesktop && mobileSheetChrome && !embedded;
  const queryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchFocusNonce) return;
    queryInputRef.current?.focus();
  }, [searchFocusNonce]);

  const showMobileDismiss = !embedded && (!isDesktop || closeButtonVariant === 'dismiss');
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

  const chromePad = embedded ? 'px-4' : mobileSheetPad ? 'px-4' : 'px-3';

  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden ${
        embedded ? 'min-h-[50vh] flex-1' : mobileSheetChrome ? 'min-h-0 flex-1' : ''
      }`}
    >
      {!embedded ? (
        <div className="mx-auto mb-2 h-1.5 w-10 shrink-0 rounded-full bg-neutral-200 lg:hidden" />
      ) : null}

      {!embedded ? (
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
          activityDatePreset={activityDatePreset}
          onActivityDatePresetChange={onActivityDatePresetChange}
        />
        <PeopleBrowsePanelTabs tab={peopleBrowseTab} onTabChange={onPeopleBrowseTabChange} />
      </div>

      <div
        className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain ${
          embedded ? `${chromePad} pb-4` : `${EXPLORE_SHEET.browseList} ${isDesktop ? 'lg:pb-8' : ''}`
        }`}
      >
        <PeopleBrowseTabContent
          tab={peopleBrowseTab}
          isSignedIn={isSignedIn}
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
