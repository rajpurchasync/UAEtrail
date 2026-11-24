import type { CrewBrowseLane, CrewPeopleFacet, CrewProfessionalKind } from '@/crew-discovery/crewBrowseState';
import {
  DEFAULT_CREW_PEOPLE_FACET,
  DEFAULT_CREW_PROFESSIONAL_KIND,
} from '@/crew-discovery/crewBrowseState';
import type { FindCrewRecommendedTab } from './findCrewRecommendedTabs';
import { normalizeFindCrewRecommendedLane } from './findCrewRecommendedTabs';

export type FindCrewMainTab = FindCrewRecommendedTab;

export const findCrewNavToBrowsePatch = (main: FindCrewMainTab): {
  crewBrowseLane: CrewBrowseLane;
  crewPeopleFacet: CrewPeopleFacet;
  crewProfessionalKind: CrewProfessionalKind;
  tripAvailabilityOnly: boolean;
} => {
  if (main === 'community') {
    return {
      crewBrowseLane: 'community',
      crewPeopleFacet: DEFAULT_CREW_PEOPLE_FACET,
      crewProfessionalKind: DEFAULT_CREW_PROFESSIONAL_KIND,
      tripAvailabilityOnly: false,
    };
  }
  if (main === 'trips') {
    return {
      crewBrowseLane: 'trips',
      crewPeopleFacet: DEFAULT_CREW_PEOPLE_FACET,
      crewProfessionalKind: DEFAULT_CREW_PROFESSIONAL_KIND,
      tripAvailabilityOnly: false,
    };
  }
  return {
    crewBrowseLane: 'people',
    crewPeopleFacet: DEFAULT_CREW_PEOPLE_FACET,
    crewProfessionalKind: DEFAULT_CREW_PROFESSIONAL_KIND,
    tripAvailabilityOnly: false,
  };
};

export const parseFindCrewRecommendedLaneFromBrowse = (input: {
  lane: CrewBrowseLane;
}): FindCrewRecommendedTab => normalizeFindCrewRecommendedLane(input.lane);