import type { ReactNode } from 'react';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../../explore/exploreBrowseTaxonomy';
import { APP_SCROLL_BODY_CLASS } from '../../config/layoutScroll';
import type { ExploreAvailablePersonDTO, ExploreMapItemDTO, MemberDiscoveryQuotaDTO } from '@uaetrail/shared-types';
import type { MemberBrowseCardDTO, SocialPersonRowDTO } from '@uaetrail/shared-types';
import type { PeopleBrowseTab } from '@/people-discovery/peopleBrowseTab';
import { ListCrewsExplorerHeader } from './ListCrewsExplorerHeader';
import { CrewsTabBody } from '../crews/CrewsTabBody';
import type { CrewsStatCounts } from '../crews/CrewsStatsTabs';
import type { CrewsAvailableOpenLens } from '../crews/crewsOpenSegment';
import type { CrewsStatTab } from '../crews/crewsStatTab';
import { segmentFromCrewsStatTab } from '../crews/crewsStatTab';
type ListCrewsExplorerProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onQuerySync: () => void;
  onSearchCommit: (scope?: ExploreSearchScopeKey | null) => void;
  onClearQuery: () => void;
  searchScopeCounts: ExploreSearchScopeCounts;
  mapHref: string;
  peopleBrowseTab: PeopleBrowseTab;
  onPeopleBrowseTabChange: (tab: PeopleBrowseTab) => void;
  crewsOpenLens: CrewsAvailableOpenLens;
  onCrewsOpenLensChange: (lens: CrewsAvailableOpenLens) => void;
  onOpenMarkAvailability: () => void;
  isSignedIn: boolean;
  filterCount: number;
  statCounts: CrewsStatCounts;
  availabilityCatalogItems: ExploreMapItemDTO[];
  exploreCatalogItems: ExploreMapItemDTO[];
  exploreCatalogLoading: boolean;
  onOpenAvailabilityCatalogItem: (item: ExploreMapItemDTO) => void;
  onOfferRideshareForAvailabilityItem?: (item: ExploreMapItemDTO) => void;
  buddyUserIds?: Set<string>;
  availabilityPeople: ExploreAvailablePersonDTO[];
  availabilityLoading: boolean;
  availabilityError: string | null;
  discoveryFriendsGoing: SocialPersonRowDTO[];
  discoveryHostsGoing: SocialPersonRowDTO[];
  discoveryDirectory: MemberBrowseCardDTO[];
  discoveryQuota: MemberDiscoveryQuotaDTO | null;
  discoveryLoading: boolean;
  discoveryError: string | null;
  suppressSearch?: boolean;
  searchPlaceholder?: string;
  enableSearchScopeHints?: boolean;
  searchResultsChrome?: boolean;
  exploreSearchResults?: boolean;
};

export const ListCrewsExplorer = ({
  query,
  onQueryChange,
  onQuerySync,
  onSearchCommit,
  onClearQuery,
  searchScopeCounts,
  mapHref,
  peopleBrowseTab,
  onPeopleBrowseTabChange,
  crewsOpenLens,
  onCrewsOpenLensChange,
  onOpenMarkAvailability,
  isSignedIn,
  filterCount,
  statCounts,
  availabilityCatalogItems,
  exploreCatalogItems,
  exploreCatalogLoading,
  onOpenAvailabilityCatalogItem,
  onOfferRideshareForAvailabilityItem,
  buddyUserIds,
  availabilityPeople,
  availabilityLoading,
  availabilityError,
  discoveryFriendsGoing,
  discoveryHostsGoing,
  discoveryDirectory,
  discoveryQuota,
  discoveryLoading,
  discoveryError,
  suppressSearch = false,
  searchPlaceholder,
  enableSearchScopeHints = true,
  searchResultsChrome = false,
  exploreSearchResults = false,
}: ListCrewsExplorerProps) => {
  const stickySearch = query.trim().length > 0;

  const onSelectStatTab = (tab: CrewsStatTab) => {
    onPeopleBrowseTabChange(segmentFromCrewsStatTab(tab));
  };

  return (
    <div
      className={`relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
        'bg-neutral-50'
      }`}
    >
      <ListCrewsExplorerHeader
        query={query}
        onQueryChange={onQueryChange}
        onQuerySync={onQuerySync}
        onSearchCommit={onSearchCommit}
        onClearQuery={onClearQuery}
        searchScopeCounts={searchScopeCounts}
        mapHref={mapHref}
        peopleBrowseTab={peopleBrowseTab}
        onPeopleBrowseTabChange={onPeopleBrowseTabChange}
        stickySearch={stickySearch}
        isSignedIn={isSignedIn}
        statCounts={statCounts}
        onOpenAvailability={onOpenMarkAvailability}
        filterCount={filterCount}
        suppressSearch={suppressSearch}
        searchPlaceholder={searchPlaceholder}
        enableSearchScopeHints={enableSearchScopeHints}
        searchResultsChrome={searchResultsChrome}
        exploreSearchResults={exploreSearchResults}
        mapListResultCount={discoveryDirectory.length}
      />
      <div
        className={`${APP_SCROLL_BODY_CLASS} min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain pb-[calc(var(--bottom-nav-height,56px)+var(--safe-bottom,0px)+24px)]`}
      >
        <div
          className={`mx-auto w-full px-4 py-3 md:py-5 ${
            searchResultsChrome ? 'max-w-lg md:px-5' : 'max-w-6xl md:px-6'
          }`}
        >
          <CrewsTabBody
            segment={peopleBrowseTab}
            crewsOpenLens={crewsOpenLens}
            onCrewsOpenLensChange={onCrewsOpenLensChange}
            onSelectStatTab={onSelectStatTab}
            onBrowseGuides={() => onPeopleBrowseTabChange('hub')}
            buddiesCount={statCounts.friends ?? 0}
            availableCount={statCounts.available ?? 0}
            everyoneCount={statCounts.everyone ?? 0}
            isSignedIn={isSignedIn}
            availabilityCatalogItems={availabilityCatalogItems}
            exploreCatalogItems={exploreCatalogItems}
            exploreCatalogLoading={exploreCatalogLoading}
            onOpenAvailabilityCatalogItem={onOpenAvailabilityCatalogItem}
            onOfferRideshareForAvailabilityItem={onOfferRideshareForAvailabilityItem}
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
            onOpenAvailability={onOpenMarkAvailability}
          />
        </div>
      </div>
    </div>
  );
};
