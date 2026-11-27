import { crewsHomePath } from '../config/mobileFiveTabNav';
import { PRODUCT_CREWS_TAB_LABEL } from '../content/productNorthStar';
import { mobileBackNavState } from '../utils/mobileBackNavState';

export {
  CREWS_ORIGIN_QUERY,
  crewsListFallbackLabel,
  groupsPathFromCrews,
  isCrewsOrigin,
  myCrewsPathFromCrews,
} from './crewOriginPaths';

/** Router state so Friends/Teams opened from Crews hub return to the list home. */
export const crewsReturnBackState = () => mobileBackNavState(crewsHomePath(), PRODUCT_CREWS_TAB_LABEL);

export { CREW_PILLAR_SURFACE_PATH, crewPillarSpec } from './crewPillarSurfaces';