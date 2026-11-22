import type { CrewPillarId } from '@uaetrail/shared-types';
import { crewHubStatTabToPillar } from '@uaetrail/shared-types';
import type { CrewBrowseLane, CrewPeopleFacet } from '@/crew-discovery/crewBrowseState';

export type CrewsStatTab = CrewPeopleFacet;

/** Browse facet pill → crew pillar. */
export const crewsStatTabPillar = (tab: CrewsStatTab): CrewPillarId => {
  if (tab === 'recommended') return 'friends';
  if (tab === 'friends') return crewHubStatTabToPillar('friends');
  if (tab === 'available') return crewHubStatTabToPillar('available');
  return crewHubStatTabToPillar('everyone');
};

export const CREWS_STAT_TAB_LABELS: Record<CrewsStatTab, string> = {
  recommended: 'Recommended',
  friends: 'Friends',
  available: 'Available',
  everyone: 'Everyone',
};

export const crewsStatTabFromFacet = (facet: CrewPeopleFacet): CrewsStatTab => facet;

export const facetFromCrewsStatTab = (tab: CrewsStatTab): CrewPeopleFacet => tab;

/** @deprecated Use crewsStatTabFromFacet */
export const crewsStatTabFromSegment = (lane: CrewBrowseLane, facet: CrewPeopleFacet): CrewsStatTab | null =>
  lane === 'people' ? facet : null;

/** @deprecated Use facetFromCrewsStatTab */
export const segmentFromCrewsStatTab = (tab: CrewsStatTab): { lane: CrewBrowseLane; facet: CrewPeopleFacet } => ({
  lane: 'people',
  facet: tab,
});

export const crewsShowsGuidesRail = (lane: CrewBrowseLane): boolean => lane === 'professional';