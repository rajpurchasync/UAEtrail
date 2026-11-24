import type { CrewPillarId } from '@uaetrail/shared-types';
import { crewPeopleFacetToPillar } from '@uaetrail/shared-types';
import type { CrewBrowseLane, CrewPeopleFacet } from '@/crew-discovery/crewBrowseState';

export type CrewsStatTab = Exclude<CrewPeopleFacet, 'recommended'>;

/** Browse facet pill → crew pillar. */
export const crewsStatTabPillar = (tab: CrewsStatTab): CrewPillarId => crewPeopleFacetToPillar(tab);

export const CREWS_STAT_TAB_LABELS: Record<CrewsStatTab, string> = {
  friends: 'Friends',
  active: 'Active now',
  available: 'Available',
  everyone: 'Everyone',
};

export const crewsStatTabFromFacet = (facet: CrewPeopleFacet): CrewsStatTab | null =>
  facet === 'recommended' ? null : facet;

export const facetFromCrewsStatTab = (tab: CrewsStatTab): CrewPeopleFacet => tab;

export const crewsShowsGuidesRail = (lane: CrewBrowseLane): boolean => lane === 'professional';