import type {
  ExploreAvailablePersonDTO,
  ExploreMapItemDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import type {
  CrewBrowseLane,
  CrewBrowseState,
  CrewPeopleFacet,
  CrewProfessionalKind,
} from '@/crew-discovery/crewBrowseState';
import { DEFAULT_CREW_PROFESSIONAL_KIND } from '@/crew-discovery/crewBrowseState';
import { normalizeCrewBrowseLaneForProduct } from '@/crew-discovery/crewBrowseFeatureGates';
import { crewDataLaneFromState } from '@/crew-discovery/crewBrowseState';
import { CrewBrowseTabContent } from '@/crew-discovery/panel/crewBrowse';
import { CrewsCommunityBody } from './CrewsCommunityBody';
import { CrewsProfessionalBody } from './CrewsProfessionalBody';
import type { ExploreActivityDatePreset } from '@/discovery/discoveryPortExploreOptionalFilters';
import type { CrewsAvailabilityGuideFilter, CrewsAvailabilityShapeFilter } from './crewsOpenSegment';

type CrewsTabBodyProps = {
  lane: CrewBrowseLane;
  facet: CrewPeopleFacet;
  professionalKind?: CrewProfessionalKind;
  availabilityShape: CrewsAvailabilityShapeFilter;
  crewsAvailabilityGuideFilter: CrewsAvailabilityGuideFilter;
  onCrewsAvailabilityGuideFilterChange: (filter: CrewsAvailabilityGuideFilter) => void;
  isSignedIn: boolean;
  availabilityPeople: ExploreAvailablePersonDTO[];
  availabilityLoading: boolean;
  availabilityError: string | null;
  friendsGoing: SocialPersonRowDTO[];
  hostsGoing: SocialPersonRowDTO[];
  followed: MemberBrowseCardDTO[];
  directory: MemberBrowseCardDTO[];
  discoveryQuota: MemberDiscoveryQuotaDTO | null;
  discoveryLoading: boolean;
  discoveryError: string | null;
  availabilityCatalogItems: ExploreMapItemDTO[];
  exploreCatalogItems: ExploreMapItemDTO[];
  exploreCatalogLoading: boolean;
  onOpenAvailabilityCatalogItem: (item: ExploreMapItemDTO) => void;
  onOfferRideshareForAvailabilityItem?: (item: ExploreMapItemDTO) => void;
  onOpenAvailability: () => void;
  friendUserIds?: Set<string>;
  /** Search-led Find crew — people as {@link CrewBrowseMemberRow}, not map catalog cards. */
  memberAvailabilityRowsOnly?: boolean;
  followedUserIds?: ReadonlySet<string>;
  activityDatePreset?: ExploreActivityDatePreset;
};

export const CrewsTabBody = ({
  lane,
  facet,
  professionalKind = DEFAULT_CREW_PROFESSIONAL_KIND,
  availabilityShape,
  crewsAvailabilityGuideFilter,
  isSignedIn,
  availabilityPeople,
  availabilityLoading,
  availabilityError,
  friendsGoing,
  hostsGoing,
  followed: _followed,
  directory,
  discoveryQuota,
  discoveryLoading,
  discoveryError,
  availabilityCatalogItems,
  exploreCatalogItems,
  exploreCatalogLoading,
  onOpenAvailabilityCatalogItem,
  onOfferRideshareForAvailabilityItem,
  onOpenAvailability,
  friendUserIds,
  memberAvailabilityRowsOnly,
  followedUserIds,
  activityDatePreset,
}: CrewsTabBodyProps) => {
  const activeLane = normalizeCrewBrowseLaneForProduct(lane);

  if (activeLane === 'professional') {
    const agencyItems = exploreCatalogItems.filter((item) => item.source === 'agency');
    return (
      <CrewsProfessionalBody
        isSignedIn={isSignedIn}
        directory={directory}
        discoveryLoading={discoveryLoading}
        agencyItems={agencyItems}
        exploreCatalogItems={exploreCatalogItems}
        exploreCatalogLoading={exploreCatalogLoading}
        onOpenAgencyItem={onOpenAvailabilityCatalogItem}
        professionalKind={professionalKind}
      />
    );
  }
  if (activeLane === 'community') {
    return <CrewsCommunityBody />;
  }

  const contentProps = {
    isSignedIn,
    availabilityCatalogItems,
    exploreCatalogItems,
    exploreCatalogLoading,
    onOpenAvailabilityCatalogItem,
    onOfferRideshareForAvailabilityItem,
    friendUserIds,
    availabilityPeople,
    availabilityLoading,
    availabilityError,
    friendsGoing,
    hostsGoing,
    directory,
    discoveryQuota,
    discoveryLoading,
    discoveryError,
    onOpenAvailability,
    availabilityShape,
    availabilityGuideFilter: crewsAvailabilityGuideFilter,
  };

  const isAvailableFacet = facet === 'available';

  return (
    <CrewBrowseTabContent
        tab={
          crewDataLaneFromState({
            lane: activeLane,
            facet,
            proKind: professionalKind,
          } satisfies CrewBrowseState) ?? 'available'
        }
        {...contentProps}
        availabilityShape={isAvailableFacet ? availabilityShape : undefined}
        availabilityGuideFilter={isAvailableFacet ? crewsAvailabilityGuideFilter : undefined}
        memberAvailabilityRowsOnly={memberAvailabilityRowsOnly}
        followedUserIds={followedUserIds}
        activityDatePreset={activityDatePreset}
      />
  );
};