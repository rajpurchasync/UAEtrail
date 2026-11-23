import type { CrewPillarId } from '@uaetrail/shared-types';
import { crewPeopleFacetToPillar } from '@uaetrail/shared-types';
import type { CrewBrowseLane, CrewPeopleFacet } from '@/crew-discovery/crewBrowseState';

export type CrewsStatTab = CrewPeopleFacet;

/** Browse facet pill → crew pillar. */
export const crewsStatTabPillar = (tab: CrewsStatTab): CrewPillarId => crewPeopleFacetToPillar(tab);

export const CREWS_STAT_TAB_LABELS: Record<CrewsStatTab, string> = {
  recommended: 'Recommended',
  friends: 'Friends',
  available: 'Available',
  everyone: 'Everyone',
};

export const crewsStatTabFromFacet = (facet: CrewPeopleFacet): CrewsStatTab => facet;

export const facetFromCrewsStatTab = (tab: CrewsStatTab): CrewPeopleFacet => tab;

export const crewsShowsGuidesRail = (lane: CrewBrowseLane): boolean => lane === 'professional';