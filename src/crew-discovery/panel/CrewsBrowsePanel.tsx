import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { CONSUMER_MODAL_CLOSE } from '../../config/consumerSurfaceTypography';
import { EXPLORE_SHEET, EXPLORE_TYPE } from '../../config/exploreTheme';
import { EXPLORE_DESKTOP_BROWSE_RAIL_SCROLL_CLASS } from '../../discovery/discoveryPortExploreMapChrome';
import type { CrewBrowseLane, CrewPeopleFacet } from '../crewBrowseState';
import { DEFAULT_CREW_PEOPLE_FACET } from '../crewBrowseState';
import { CrewBrowsePanelTabs } from './CrewBrowsePanelTabs';
import type { ExploreAvailablePersonDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { EXPLORE_CREWS_PANEL_TITLE } from '../../content/exploreCrewsCopy';
import type {
  MemberBrowseCardDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import type { UserRole } from '@uaetrail/shared-types';
import type { DiscoverCrewRecommendationsQueryParams } from '../lib/crewRecommendationsQuery';
import { CrewBrowseSearchField } from './crewBrowse';
import { CrewsStatsTabs, CrewsTabBody } from '@/discovery/discoveryPortListFindCrew';

export interface CrewsBrowsePanelProps {
  isDesktop: boolean;
  embedded?: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onQuerySync: () => void;
  onClose: () => void;
  closePanelAriaLabel?: string;
  closeButtonVariant?: 'collapse' | 'dismiss';
  searchFocusNonce?: number;
  crewBrowseLane: CrewBrowseLane;
  crewPeopleFacet: CrewPeopleFacet;
  onCrewBrowseLaneChange: (lane: CrewBrowseLane) => void;
  onCrewPeopleFacetChange: (facet: CrewPeopleFacet) => void;
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
  discoveryAvailabilityOnMap: import('@uaetrail/shared-types').MemberDiscoveryAvailabilityRowDTO[];
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
  availabilityCatalogItems: ExploreMapItemDTO[];
  exploreCatalogItems: ExploreMapItemDTO[];
  exploreCatalogLoading: boolean;
  onOpenAvailabilityCatalogItem: (item: ExploreMapItemDTO) => void;
  onOfferRideshareForAvailabilityItem?: (item: ExploreMapItemDTO) => void;
  onOpenIntentOpen?: () => void;
  friendUserIds?: Set<string>;
  crewRecommendationsQuery: DiscoverCrewRecommendationsQueryParams;
}

export const CrewsBrowsePanel = ({
  isDesktop,
  embedded = false,
  query,
  onQueryChange,
  onQuerySync,
  onClose,
  closePanelAriaLabel = 'Close Crews',
  searchFocusNonce = 0,
  crewBrowseLane,
  crewPeopleFacet,
  onCrewBrowseLaneChange,
  onCrewPeopleFacetChange,
  discoveryFriendsGoing,
  discoveryHostsGoing,
  discoveryFollowed,
  discoveryDirectory,
  discoveryQuota,
  discoveryLoading,
  discoveryError,
  availabilityPeople = [],
  availabilityLoading = false,
  availabilityError = null,
  isSignedIn,
  mobileSheetChrome = false,
  availabilityCatalogItems,
  exploreCatalogItems,
  exploreCatalogLoading,
  onOpenAvailabilityCatalogItem,
  onOfferRideshareForAvailabilityItem,
  onOpenIntentOpen,
  friendUserIds,
  crewRecommendationsQuery: _crewRecommendationsQuery,
}: CrewsBrowsePanelProps) => {
  const mobileSheetPad = !isDesktop && mobileSheetChrome && !embedded;
  const queryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchFocusNonce) return;
    queryInputRef.current?.focus();
  }, [searchFocusNonce]);

  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      className={CONSUMER_MODAL_CLOSE.button}
      aria-label={closePanelAriaLabel}
    >
      <X className={CONSUMER_MODAL_CLOSE.icon} aria-hidden />
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
              {EXPLORE_CREWS_PANEL_TITLE}
            </h2>
            <div className="flex justify-end">{closeButton}</div>
          </div>
        </div>
      ) : null}

      <div className={chromePad}>
        <CrewBrowseSearchField
          query={query}
          onQueryChange={onQueryChange}
          onQuerySync={onQuerySync}
          inputRef={queryInputRef}
        />
        <CrewBrowsePanelTabs tab={crewBrowseLane} onTabChange={onCrewBrowseLaneChange} />
        {crewBrowseLane === 'people' ? (
          <CrewsStatsTabs
            activeFacet={crewPeopleFacet}
            counts={{
              available: availabilityPeople.length + availabilityCatalogItems.length,
            }}
            onFacetChange={onCrewPeopleFacetChange}
            onClearToDefault={() => onCrewPeopleFacetChange(DEFAULT_CREW_PEOPLE_FACET)}
          />
        ) : null}
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
        <CrewsTabBody
          lane={crewBrowseLane}
          facet={crewPeopleFacet}
          availabilityShape="all"
          crewsAvailabilityGuideFilter="all"
          onCrewsAvailabilityGuideFilterChange={() => {}}
          isSignedIn={isSignedIn}
          availabilityCatalogItems={availabilityCatalogItems}
          exploreCatalogItems={exploreCatalogItems}
          exploreCatalogLoading={exploreCatalogLoading}
          onOpenAvailabilityCatalogItem={onOpenAvailabilityCatalogItem}
          onOfferRideshareForAvailabilityItem={onOfferRideshareForAvailabilityItem}
          friendUserIds={friendUserIds}
          availabilityPeople={availabilityPeople}
          availabilityLoading={availabilityLoading}
          availabilityError={availabilityError}
          friendsGoing={discoveryFriendsGoing}
          hostsGoing={discoveryHostsGoing}
          followed={discoveryFollowed}
          directory={discoveryDirectory}
          discoveryQuota={discoveryQuota}
          discoveryLoading={discoveryLoading}
          discoveryError={discoveryError}
          onOpenAvailability={onOpenIntentOpen ?? (() => {})}
        />
      </div>
    </div>
  );
};