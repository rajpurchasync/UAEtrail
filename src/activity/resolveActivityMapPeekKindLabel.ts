import { discoveryCardIsSeeking, type DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { capitalize } from '../utils';

/** Short type line beside host (Hiking · Rideshare · Looking …). */
export const resolveActivityMapPeekKindLabel = (card: DiscoveryCardModel): string | null => {
  if (card.source !== 'activity') return null;
  if (discoveryCardIsSeeking(card)) return 'Looking';
  const kind = card.kind?.trim();
  if (!kind) return null;
  if (kind === 'event') return 'Event';
  return capitalize(kind);
};