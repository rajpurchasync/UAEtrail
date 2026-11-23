import { scoreMapExplorePlaceCore, type DiscoverRecommendationSignal } from '@uaetrail/shared-types';
import type { Location } from '../../domain/types.js';

export type RankMapExplorePlaceInput = {
  location: Location;
  wishlistLocationIds: Set<string>;
  wishlistAreaIds: Set<string>;
  viewerGeo?: { lat: number; lng: number } | null;
};

export type RankMapExplorePlaceResult = {
  exploreItemId: string;
  score: number;
  signals: DiscoverRecommendationSignal[];
  title: string;
  source: 'place';
};

/** Geography pins for map recommendations — venue:* explore ids. */
export const rankMapExplorePlace = (input: RankMapExplorePlaceInput): RankMapExplorePlaceResult | null => {
  const { location } = input;
  if (location.latitude == null || location.longitude == null) return null;

  const wishlistPlace = input.wishlistLocationIds.has(location.id);
  const wishlistArea = Boolean(location.areaId && input.wishlistAreaIds.has(location.areaId));

  const ranked = scoreMapExplorePlaceCore({
    boosts: {
      featuredPlace: Boolean(location.featured),
      wishlistPlace,
      wishlistArea: !wishlistPlace && wishlistArea,
    },
    pin: { lat: location.latitude, lng: location.longitude },
    viewerGeo: input.viewerGeo,
  });
  if (!ranked) return null;

  return {
    exploreItemId: `venue:${location.id}`,
    score: ranked.score,
    signals: ranked.signals,
    title: location.name,
    source: 'place',
  };
};