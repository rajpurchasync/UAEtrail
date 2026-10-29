import type { MapPeekDetailNavState } from '../../explore/mapPeekDetailNavState';
import { mobileBackNavState, type MobileBackNavState } from '../../utils/mobileBackNav';

export type ListExplorerEntityLinkState = MapPeekDetailNavState & MobileBackNavState;

/** Entity opened from list explorer — nested back returns to detail, then to this list URL. */
export const listExplorerEntityLinkState = (returnTo: string): ListExplorerEntityLinkState => ({
  ...mobileBackNavState(returnTo, 'Browse'),
  detailBackTo: returnTo,
});
