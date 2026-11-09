import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../../explore/exploreBrowseTaxonomy';
import { APP_SCROLL_BODY_CLASS } from '../../config/layoutScroll';
import type { ExploreAvailablePersonDTO, ExploreMapItemDTO, MemberDiscoveryQuotaDTO } from '@uaetrail/shared-types';
import type { MemberBrowseCardDTO, SocialPersonRowDTO } from '@uaetrail/shared-types';
import { PeopleBrowseTabContent } from '@/people-discovery/panel/peopleBrowse';
import type { PeopleBrowseTab } from '@/people-discovery/peopleBrowseTab';
import { ListCrewsExplorerHeader } from './ListCrewsExplorerHeader';

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
  isSignedIn: boolean;
  seekingActivities: ExploreMapItemDTO[];
  exploreCatalogItems: ExploreMapItemDTO[];
  exploreCatalogLoading: boolean;
  onOpenSeekingActivity: (item: ExploreMapItemDTO) => void;
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
  isSignedIn,
  seekingActivities,
  exploreCatalogItems,
  exploreCatalogLoading,
  onOpenSeekingActivity,
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
}: ListCrewsExplorerProps) => {
  const stickySearch = query.trim().length > 0;

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-neutral-50">
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
      />
      <div
        className={`${APP_SCROLL_BODY_CLASS} min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain pb-[calc(var(--bottom-nav-height,56px)+var(--safe-bottom,0px)+24px)]`}
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-3 md:px-6 md:py-5">
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
    </div>
  );
};
