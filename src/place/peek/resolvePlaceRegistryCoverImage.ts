import type { ExploreCardModel } from '../../explore/exploreCardModel';
import { resolveBrowsePosterCoverUrl, browsePosterFallbackClass } from '../../list/browsePosterCover';
import type { Place } from '../../types/place';

/** Registry places must ship `images[0]` — peek/detail always resolve a cover URL. */
export const resolvePlaceRegistryCoverUrl = (card: ExploreCardModel): string | null =>
  resolveBrowsePosterCoverUrl(card);

export const resolvePlaceCoverFromPlace = (place: Pick<Place, 'images'>): string | null =>
  place.images[0]?.trim() || null;

export const placeCoverFallbackClass = (tone: ExploreCardModel['tone']): string =>
  browsePosterFallbackClass(tone);
