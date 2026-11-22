import type {
  ExploreAvailablePersonDTO,
  ExploreMapItemDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import { buildRecommendedCrewFeed } from '../../buildRecommendedCrewFeed';
import { EXPLORE_CREWS_FRIENDS_GOING_EMPTY } from '@/content/exploreCrewsCopy';
import type { CrewsAvailabilityGuideFilter, CrewsAvailableOpenLens } from '@/list/crews/crewsOpenSegment';
import { CrewBrowseAvailabilityMapList } from './CrewBrowseAvailabilityMapList';
import { CrewBrowseMemberRow } from './CrewBrowseMemberRow';
import { CREW_BROWSE_LIST_STACK } from './crewBrowseListTheme';
import { CrewBrowseListEmpty, CrewBrowseListLoading } from './CrewBrowseListStates';
import { ExploreGuestSignInCard } from '@/explore/ui/ExploreGuestSignInCard';

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
  buddyUserIds?: Set<string>;
};

export const CrewBrowseRecommendedBody = ({
  isSignedIn,
  friendsGoing,
  hostsGoing,
  availabilityPeople,
  directory,
  discoveryQuota,
  discoveryLoading,
  availabilityCatalogItems,
  exploreCatalogItems,
  exploreCatalogLoading,
  onOpenAvailabilityCatalogItem,
  onOfferRideshareForAvailabilityItem,
  buddyUserIds,
}: Props) => {
  if (!isSignedIn) {
    return <ExploreGuestSignInCard intent="explore-people-browse" compact />;
  }

  if (discoveryLoading) {
    return <CrewBrowseListLoading />;
  }

  const rows = buildRecommendedCrewFeed({
    friendsGoing,
    hostsGoing,
    availabilityPeople,
    directory,
    discoveryQuota,
  });

  const mapTeaser = availabilityCatalogItems.slice(0, 6);

  return (
    <div className="space-y-6">
      {rows.length > 0 ? (
        <ul className={CREW_BROWSE_LIST_STACK}>
          {rows.map((row) => {
            const { key, userId: _userId, ...memberProps } = row;
            return (
              <li key={key}>
                <CrewBrowseMemberRow {...memberProps} />
              </li>
            );
          })}
        </ul>
      ) : (
        <CrewBrowseListEmpty>{EXPLORE_CREWS_FRIENDS_GOING_EMPTY}</CrewBrowseListEmpty>
      )}
      {mapTeaser.length > 0 ? (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">On the map</h3>
          <CrewBrowseAvailabilityMapList
            availabilityCatalogItems={mapTeaser}
            exploreCatalogItems={exploreCatalogItems}
            loading={exploreCatalogLoading}
            onOpenAvailabilityCatalogItem={onOpenAvailabilityCatalogItem}
            onOfferRideshareForAvailabilityItem={onOfferRideshareForAvailabilityItem}
            buddyUserIds={buddyUserIds}
          />
        </section>
      ) : null}
    </div>
  );
};