import type {
  ExploreAvailablePersonDTO,
  ExploreMapItemDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import type { DiscoverCrewRecommendationsQueryParams } from '../../lib/crewRecommendationsQuery';
import { useDiscoverCrewRecommendations } from '@/hooks/useDiscoverCrewRecommendations';
import { resolveRecommendedCrewFeedRows } from '../../resolveRecommendedCrewFeedRows';
import { EXPLORE_CREWS_FRIENDS_GOING_EMPTY } from '@/content/exploreCrewsCopy';
import type { CrewsAvailabilityGuideFilter, CrewsAvailableOpenLens } from '@/discovery/discoverySessionListCrewsOpen';
import { CrewBrowseAvailabilityMapList } from './CrewBrowseAvailabilityMapList';
import { CrewBrowseMemberRow } from './CrewBrowseMemberRow';
import { CREW_BROWSE_LIST_STACK } from './crewBrowseListTheme';
import { BrowseListSectionHeader } from '@/discovery/discoverySessionListCrewsPresentation';
import { CrewBrowseListEmpty, CrewBrowseListLoading } from './CrewBrowseListStates';
import { useCommunityDiscoverList } from '@/crew-discovery/hooks/useCommunityDiscoverList';
import { CommunityDiscoverBrowseList } from '@/discovery/discoverySessionListCrewsPresentation';
import { FEATURE_FLAGS } from '@/config/platform';
import {
  CrewsGuidesRail,
  filterCrewsGuideDirectoryCards,
} from '@/discovery/discoverySessionListCrewsPresentation';
import {
  buildMemberBrowseRowFromAvailability,
  filterAvailabilityByCapacity,
} from '../../memberBrowseRowModel';
import { crewBrowseHrefForGuest } from '@/crew-discovery/crewGuestBrowse';

type Props = {
  isSignedIn: boolean;
  crewsOpenLens: CrewsAvailableOpenLens;
  availabilityGuideFilter: CrewsAvailabilityGuideFilter;
  availabilityPeople: ExploreAvailablePersonDTO[];
  availabilityLoading: boolean;
  availabilityError: string | null;
  friendsGoing: SocialPersonRowDTO[];
  hostsGoing: SocialPersonRowDTO[];
  directory: MemberBrowseCardDTO[];
  discoveryQuota: MemberDiscoveryQuotaDTO | null;
  discoveryLoading: boolean;
  discoveryError: string | null;
  availabilityCatalogItems: ExploreMapItemDTO[];
  exploreCatalogItems: ExploreMapItemDTO[];
  exploreCatalogLoading: boolean;
  onOpenAvailabilityCatalogItem: (item: ExploreMapItemDTO) => void;
  onOfferRideshareForAvailabilityItem?: (item: ExploreMapItemDTO) => void;
  friendUserIds?: Set<string>;
  crewRecommendationsQuery: DiscoverCrewRecommendationsQueryParams;
};

const RecommendedCommunitiesSection = () => {
  if (!FEATURE_FLAGS.communityDiscover) return null;
  const { data, isPending, error } = useCommunityDiscoverList(true);
  if (isPending) {
    return (
      <section className="space-y-2">
        <BrowseListSectionHeader label="Communities" />
        <p className="text-sm text-neutral-500">Loading communities…</p>
      </section>
    );
  }
  if (error || !data?.length) return null;
  return (
    <section className="space-y-2">
      <BrowseListSectionHeader label="Communities" />
      <CommunityDiscoverBrowseList rows={data} compact />
    </section>
  );
};

export const CrewBrowseRecommendedBody = ({
  isSignedIn,
  friendsGoing,
  hostsGoing,
  availabilityPeople,
  directory,
  discoveryQuota,
  discoveryLoading,
  availabilityGuideFilter,
  availabilityLoading,
  availabilityCatalogItems,
  exploreCatalogItems,
  exploreCatalogLoading,
  onOpenAvailabilityCatalogItem,
  onOfferRideshareForAvailabilityItem,
  friendUserIds,
  crewRecommendationsQuery,
}: Props) => {
  const serverRecommendations = useDiscoverCrewRecommendations(
    isSignedIn,
    crewRecommendationsQuery
  );

  const communitiesSection = <RecommendedCommunitiesSection />;

  if (!isSignedIn) {
    const availableRows = filterAvailabilityByCapacity(availabilityPeople, availabilityGuideFilter)
      .slice(0, 12)
      .map(buildMemberBrowseRowFromAvailability);
    const guideCards = filterCrewsGuideDirectoryCards(directory);

    return (
      <div className="space-y-5">
        {communitiesSection}
        {availabilityLoading ? (
          <CrewBrowseListLoading />
        ) : availableRows.length > 0 ? (
          <section className="space-y-2">
            <BrowseListSectionHeader label="Available this week" />
            <ul className={CREW_BROWSE_LIST_STACK}>
              {availableRows.map((row) => {
                const { key, userId: _userId, profileHref, actionHref, ...memberProps } = row;
                return (
                  <li key={key}>
                    <CrewBrowseMemberRow
                      {...memberProps}
                      profileHref={crewBrowseHrefForGuest(profileHref, false)}
                      actionHref={actionHref ? crewBrowseHrefForGuest(actionHref, false) : undefined}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
        {guideCards.length > 0 ? (
          <section className="space-y-2">
            <BrowseListSectionHeader label="Guides &amp; porters" />
            <CrewsGuidesRail guides={guideCards} isSignedIn={false} />
          </section>
        ) : null}
        {discoveryLoading ? null : (
          <p className="px-1 text-center text-sm text-neutral-500">
            Sign in for personalized picks, friend lists, and messaging.
          </p>
        )}
      </div>
    );
  }

  if (discoveryLoading || serverRecommendations.isLoading) {
    return (
      <div className="space-y-5">
        {communitiesSection}
        <CrewBrowseListLoading />
      </div>
    );
  }

  const rows = resolveRecommendedCrewFeedRows(serverRecommendations.data, {
    friendsGoing,
    hostsGoing,
    availabilityPeople,
    directory,
    discoveryQuota,
  });

  const mapTeaser = availabilityCatalogItems.slice(0, 6);

  return (
    <div className="space-y-5">
      {communitiesSection}
      {rows.length > 0 ? (
        <section className="space-y-2">
          <BrowseListSectionHeader label="Picked for you" />
          <ul className={CREW_BROWSE_LIST_STACK}>
            {rows.map((row) => {
              const { key, userId: _userId, profileHref, actionHref, ...memberProps } = row;
              return (
                <li key={key}>
                  <CrewBrowseMemberRow
                    {...memberProps}
                    profileHref={profileHref}
                    actionHref={actionHref}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <CrewBrowseListEmpty>{EXPLORE_CREWS_FRIENDS_GOING_EMPTY}</CrewBrowseListEmpty>
      )}
      {mapTeaser.length > 0 ? (
        <section className="space-y-2">
          <BrowseListSectionHeader label="On the map" />
          <CrewBrowseAvailabilityMapList
            availabilityCatalogItems={mapTeaser}
            exploreCatalogItems={exploreCatalogItems}
            loading={exploreCatalogLoading}
            onOpenAvailabilityCatalogItem={onOpenAvailabilityCatalogItem}
            onOfferRideshareForAvailabilityItem={onOfferRideshareForAvailabilityItem}
            friendUserIds={friendUserIds}
          />
        </section>
      ) : null}
    </div>
  );
};