import type { CrewPeopleFacet } from '@/crew-discovery/crewBrowseState';

/** Find crew People lane — single discover list (no sub-tabs on search-led Find crew). */
export const FIND_CREW_PEOPLE_STAT_ORDER = ['available'] as const;

export type FindCrewPeopleStatTab = (typeof FIND_CREW_PEOPLE_STAT_ORDER)[number];

export const isFindCrewPeopleStatTab = (value: string): value is FindCrewPeopleStatTab =>
  (FIND_CREW_PEOPLE_STAT_ORDER as readonly string[]).includes(value);

/** Inbound URL facet → Find crew tab (legacy friends/recommended/going → available). */
export const normalizeFindCrewPeopleFacet = (facet: CrewPeopleFacet): FindCrewPeopleStatTab => {
  if (facet === 'everyone' || facet === 'active') return 'available';
  return 'available';
};

export const findCrewStatTabFromFacet = (facet: CrewPeopleFacet): FindCrewPeopleStatTab =>
  normalizeFindCrewPeopleFacet(facet);

export const facetFromFindCrewStatTab = (_tab: FindCrewPeopleStatTab): CrewPeopleFacet => 'available';