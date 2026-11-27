import type { CrewPillarId } from '@uaetrail/shared-types';
import {
  CREW_PILLAR_SPECS,
  crewHubStatTabToPillar,
  crewPeopleFacetToPillar,
} from '@uaetrail/shared-types';
import { GROUPS_PATH, MY_CREWS_PATH } from '../config/surfacePaths';
import { exploreCrewsPath } from '../config/routingCatalog';

/**
 * FE routing anchors per crew pillar — use for nav, guards, and copy context.
 * Wire/API names stay in domain modules (`friendsApi`, `member_availability`, …).
 */
export const CREW_PILLAR_SURFACE_PATH: Partial<Record<CrewPillarId, string>> = {
  friends: MY_CREWS_PATH,
  directory: `${exploreCrewsPath({ list: true })}&peopleFacet=everyone`,
  teams: GROUPS_PATH,
  guides_operators: exploreCrewsPath({ list: false }),
  outing_roster: '/activity/:id',
  intent_signal: '/explore',
};

export const crewPillarSpec = (id: CrewPillarId) => CREW_PILLAR_SPECS[id];

export { crewPeopleFacetToPillar, crewHubStatTabToPillar };
export type { CrewPillarId };