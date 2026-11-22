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
import { CrewBrowseRecommendedBody } from '@/crew-discovery/panel/crewBrowse/CrewBrowseRecommendedBody';
import { CrewsAvailableSubChips } from './CrewsAvailableSubChips';
import { CrewsAvailabilityGuideSubChips } from './CrewsAvailabilityGuideSubChips';
import { CrewsCommunityBody } from './CrewsCommunityBody';
import { CrewsProfessionalBody } from './CrewsProfessionalBody';
import type { CrewsAvailabilityGuideFilter, CrewsAvailableOpenLens } from './crewsOpenSegment';

type CrewsTabBodyProps = {
  lane: CrewBrowseLane;
  facet: CrewPeopleFacet;
  professionalKind?: CrewProfessionalKind;
  crewsOpenLens: CrewsAvailableOpenLens;
  onCrewsOpenLensChange: (lens: CrewsAvailableOpenLens) => void;
  crewsAvailabilityGuideFilter: CrewsAvailabilityGuideFilter;
  onCrewsAvailabilityGuideFilterChange: (filter: CrewsAvailabilityGuideFilter) => void;
  isSignedIn: boolean;
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
  onOpenAvailability: () => void;
  buddyUserIds?: Set<string>;
};

export const CrewsTabBody = ({
  lane,
  facet,
  professionalKind = DEFAULT_CREW_PROFESSIONAL_KIND,
  crewsOpenLens,
  onCrewsOpenLensChange,
  crewsAvailabilityGuideFilter,
  onCrewsAvailabilityGuideFilterChange,
  isSignedIn,
  availabilityPeople,
  availabilityLoading,
  availabilityError,
  friendsGoing,
  hostsGoing,
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
  buddyUserIds,
}: CrewsTabBodyProps) => {
  const activeLane = normalizeCrewBrowseLaneForProduct(lane);

  if (activeLane === 'professional') {
    const agencyItems = exploreCatalogItems.filter((item) => item.source === 'agency');
    return (
      <CrewsProfessionalBody
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
    buddyUserIds,
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
    crewsOpenLens,
    availabilityGuideFilter: crewsAvailabilityGuideFilter,
  };

  const isAvailableFacet = facet === 'available';

  return (
    <>
      {isAvailableFacet ? (
        <CrewsAvailableSubChips lens={crewsOpenLens} onLensChange={onCrewsOpenLensChange} />
      ) : null}
      {isAvailableFacet && (crewsOpenLens === 'all' || crewsOpenLens === 'marked') ? (
        <CrewsAvailabilityGuideSubChips
          filter={crewsAvailabilityGuideFilter}
          onFilterChange={onCrewsAvailabilityGuideFilterChange}
        />
      ) : null}
      {facet === 'recommended' ? (
        <CrewBrowseRecommendedBody {...contentProps} />
      ) : (
        <CrewBrowseTabContent
          tab={
            crewDataLaneFromState({
              lane: activeLane,
              facet,
              proKind: professionalKind,
            } satisfies CrewBrowseState) ?? 'available'
          }
          {...contentProps}
          crewsOpenLens={isAvailableFacet ? crewsOpenLens : undefined}
          availabilityGuideFilter={isAvailableFacet ? crewsAvailabilityGuideFilter : undefined}
        />
      )}
    </>
  );
};