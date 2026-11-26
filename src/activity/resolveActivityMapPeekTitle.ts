import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { browseCardTitle } from '../discovery/discoverySessionListFeed';

/** Map trip peek — host-provided outing title, not the social list headline. */
export const resolveActivityMapPeekTitle = (card: DiscoveryCardModel): string =>
  browseCardTitle(card);