import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { resolveBrowsePosterCoverUrl, browsePosterFallbackClass } from '../../discovery/discoveryPortListPeek';
import type { Place } from '../../types/place';

/** Registry places must ship `images[0]` — peek/detail always resolve a cover URL. */
export const resolvePlaceRegistryCoverUrl = (card: DiscoveryCardModel): string | null =>
  resolveBrowsePosterCoverUrl(card);

export const resolvePlaceCoverFromPlace = (place: Pick<Place, 'images'>): string | null =>
  place.images[0]?.trim() || null;

export const placeCoverFallbackClass = (tone: DiscoveryCardModel['tone']): string =>
  browsePosterFallbackClass(tone);
