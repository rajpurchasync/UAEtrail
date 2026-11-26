import type { MapPeekDetailNavState } from '../../discovery/discoveryPortExploreMapPeekNav';
import { mobileBackNavState, type MobileBackNavState } from '../../utils/mobileBackNav';

export type BrowseListEntityLinkState = MapPeekDetailNavState & MobileBackNavState;

/** Entity opened from list browse — nested back returns to detail, then to this list URL. */
export const browseListEntityLinkState = (returnTo: string): BrowseListEntityLinkState => ({
  ...mobileBackNavState(returnTo, 'Browse'),
  detailBackTo: returnTo,
});