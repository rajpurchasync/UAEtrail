import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { resolveTripBrowseCardCopy } from '../discovery/discoverySessionListPeek';

/** Map trip peek — schedule under host (date · time), not a duplicate meta block under title. */
export const resolveActivityMapPeekScheduleLine = (card: DiscoveryCardModel): string | null => {
  if (card.source !== 'activity') return null;
  return resolveTripBrowseCardCopy(card).whenLine;
};