import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { resolveTripBrowseCardCopy } from '../discovery/discoveryPortListPeek';
import { sanitizeExploreLocation } from '@uaetrail/shared-types';

/** Map peek — where the outing meets (emirate/place), not buried in the title. */
export const resolveActivityMapPeekLocationLine = (card: DiscoveryCardModel): string | null => {
  if (card.source !== 'activity') return null;

  const browse = resolveTripBrowseCardCopy(card);
  const primary = sanitizeExploreLocation(browse.locationLine);
  const meet =
    browse.placeLogisticsLabels
      .map((label) => sanitizeExploreLocation(label))
      .find((label): label is string => Boolean(label)) ?? null;

  if (primary && meet && !primary.toLowerCase().includes(meet.toLowerCase())) {
    return `${primary} · ${meet}`;
  }
  return primary ?? meet;
};