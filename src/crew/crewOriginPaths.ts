import {
  myCrewsPath,
  CREWS_ORIGIN_QUERY,
  groupsPath,
  isCrewsOriginQuery,
} from '../config/surfacePaths';
import { PRODUCT_CREWS_TAB_LABEL } from '../content/productNorthStar';

export { CREWS_ORIGIN_QUERY, isCrewsOriginQuery as isCrewsOrigin };

export const myCrewsPathFromCrews = (): string => myCrewsPath({ from: CREWS_ORIGIN_QUERY });

export const groupsPathFromCrews = (options?: Omit<Parameters<typeof groupsPath>[0], 'from'>): string =>
  groupsPath({ ...options, from: CREWS_ORIGIN_QUERY });

export const crewsListFallbackLabel = PRODUCT_CREWS_TAB_LABEL;