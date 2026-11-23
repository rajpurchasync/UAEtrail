import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../../explore/exploreBrowseTaxonomy';
import { APP_SCROLL_BODY_CLASS } from '../../config/layoutScroll';
import type { DiscoverCrewRecommendationsQueryParams } from '@/crew-discovery/lib/crewRecommendationsQuery';
import type {
  ExploreAvailablePersonDTO,
  ExploreMapItemDTO,
  MemberDiscoveryQuotaDTO,
  MemberBrowseCardDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import type {
  CrewBrowseLane,
  CrewPeopleFacet,
  CrewProfessionalKind,
} from '@/crew-discovery/crewBrowseState';
import { ListCrewsExplorerHeader } from './ListCrewsExplorerHeader';
import { CrewsTabBody } from '../crews/CrewsTabBody';
import type { CrewsStatCounts } from '../crews/CrewsStatsTabs';
import type { CrewsAvailabilityGuideFilter, CrewsAvailableOpenLens } from '../crews/crewsOpenSegment';

type ListCrewsExplorerProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onQuerySync: () => void;
  onSearchCommit: (scope?: ExploreSearchScopeKey | null) => void;
  onClearQuery: () => void;
  searchScopeCounts: ExploreSearchScopeCounts;
  mapHref: string;
  crewBrowseLane: CrewBrowseLane;
  crewPeopleFacet: CrewPeopleFacet;
  onCrewBrowseLaneChange: (lane: CrewBrowseLane) => void;
  onCrewPeopleFacetChange: (facet: CrewPeopleFacet) => void;
  crewProfessionalKind: CrewProfessionalKind;
  onCrewProfessionalKindChange: (kind: CrewProfessionalKind) => void;
  crewsOpenLens: CrewsAvailableOpenLens;
  onCrewsOpenLensChange: (lens: CrewsAvailableOpenLens) => void;
  crewsAvailabilityGuideFilter: CrewsAvailabilityGuideFilter;
  onCrewsAvailabilityGuideFilterChange: (filter: CrewsAvailabilityGuideFilter) => void;
  onOpenIntentOpen: () => void;
  isSignedIn: boolean;
  filterCount: number;
  statCounts: CrewsStatCounts;
  availabilityCatalogItems: ExploreMapItemDTO[];
  exploreCatalogItems: ExploreMapItemDTO[];
  exploreCatalogLoading: boolean;
  onOpenAvailabilityCatalogItem: (item: ExploreMapItemDTO) => void;
  onOfferRideshareForAvailabilityItem?: (item: ExploreMapItemDTO) => void;
  friendUserIds?: Set<string>;
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
  crewRecommendationsQuery: DiscoverCrewRecommendationsQueryParams;
};

export const ListCrewsExplorer = ({
  query,
  onQueryChange,
  onQuerySync,
  onSearchCommit,
  onClearQuery,
  searchScopeCounts,
  mapHref,
  crewBrowseLane,
  crewPeopleFacet,
  onCrewBrowseLaneChange,
  onCrewPeopleFacetChange,
  crewProfessionalKind,
  onCrewProfessionalKindChange,
  crewsOpenLens,
  onCrewsOpenLensChange,
  crewsAvailabilityGuideFilter,
  onCrewsAvailabilityGuideFilterChange,
  onOpenIntentOpen,
  isSignedIn,
  filterCount,
  statCounts,
  availabilityCatalogItems,
  exploreCatalogItems,
  exploreCatalogLoading,
  onOpenAvailabilityCatalogItem,
  onOfferRideshareForAvailabilityItem,
  friendUserIds,
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
  crewRecommendationsQuery,
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
        crewBrowseLane={crewBrowseLane}
        crewPeopleFacet={crewPeopleFacet}
        onCrewBrowseLaneChange={onCrewBrowseLaneChange}
        onCrewPeopleFacetChange={onCrewPeopleFacetChange}
        crewProfessionalKind={crewProfessionalKind}
        onCrewProfessionalKindChange={onCrewProfessionalKindChange}
        stickySearch={stickySearch}
        isSignedIn={isSignedIn}
        statCounts={statCounts}
        onOpenAvailability={onOpenIntentOpen}
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
            lane={crewBrowseLane}
            facet={crewPeopleFacet}
            professionalKind={crewProfessionalKind}
            crewsOpenLens={crewsOpenLens}
            onCrewsOpenLensChange={onCrewsOpenLensChange}
            crewsAvailabilityGuideFilter={crewsAvailabilityGuideFilter}
            onCrewsAvailabilityGuideFilterChange={onCrewsAvailabilityGuideFilterChange}
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
            directory={discoveryDirectory}
            discoveryQuota={discoveryQuota}
            discoveryLoading={discoveryLoading}
            discoveryError={discoveryError}
            onOpenAvailability={onOpenIntentOpen}
            crewRecommendationsQuery={crewRecommendationsQuery}
          />
        </div>
      </div>
    </div>
  );
};