import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import {
  discoveryCardActivityShowsPeekSpots,
  discoveryCardIsAvailabilityPin,
} from '../discovery/discoveryCardModel';
import { resolveActivityMapPeekSpotsChipLabel } from './resolveActivityMapPeekChipLabels';

/** Spots remaining — plain line under policies, not mixed with rules chips. */
export const resolveActivityMapPeekCapacityLine = (card: DiscoveryCardModel): string | null => {
  if (card.source !== 'activity') return null;
  if (discoveryCardIsAvailabilityPin(card)) return null;
  if (!discoveryCardActivityShowsPeekSpots(card)) return null;

  const compact = resolveActivityMapPeekSpotsChipLabel(card);
  if (!compact) return null;
  if (compact === 'Full') return 'No spots left';
  if (/^\d+$/.test(compact)) return `${compact} spots`;
  if (/^\d+\s+of\s+\d+$/.test(compact)) {
    const [left, total] = compact.split(/\s+of\s+/);
    return `${left} of ${total} spots left`;
  }
  return compact;
};