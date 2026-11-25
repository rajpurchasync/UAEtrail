import type { DiscoverRecommendationSignal } from './discover-recommendations.js';
import type { ExploreMapItemDTO } from './index.js';
import {
  exploreMapItemIsAvailabilityCatalog,
  exploreMapItemIsHostedActivity,
  exploreMapItemIsRetiredSeekingActivity,
} from './explore-activity-mode.js';
import { isGeographyMapSource } from './wire-lexicon.js';

export const MAP_EXPLORE_RECOMMEND_MS_PER_DAY = 86_400_000;

/** Shared rank weights — server `matching/rank-map-explore*` + client guest fallback. */
export const MAP_EXPLORE_RECOMMEND_WEIGHTS = {
  activityBase: 80,
  activitySoonDays: 3,
  activityTimingCap: 28,
  activityPastPenalty: 40,
  activityParticipantCap: 8,
  activityParticipantStep: 3,
  activitySlotsOpen: 6,
  friendOnOutingBoost: 24,
  activityWishlistPlace: 20,
  activityWishlistArea: 14,
  placeBase: 38,
  placeFeatured: 12,
  placeRatingThreshold: 4,
  placeRatingBoost: 8,
  placeWishlistPlace: 22,
  placeWishlistArea: 16,
  shopBase: 12,
  geoNearKm: 40,
  geoNearBoost: 10,
} as const;

export type MapExploreViewerGeo = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;

export const haversineDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
};

export const applyMapExploreGeoBoost = (
  ranked: MapExploreRecommendationScore,
  pin: MapExploreViewerGeo | null | undefined,
  viewer: MapExploreViewerGeo | null | undefined
): MapExploreRecommendationScore => {
  if (!viewer || !pin) return ranked;
  const km = haversineDistanceKm(viewer.lat, viewer.lng, pin.lat, pin.lng);
  if (km > MAP_EXPLORE_RECOMMEND_WEIGHTS.geoNearKm) return ranked;
  const signals: DiscoverRecommendationSignal[] = [...new Set([...ranked.signals, 'near_you' as const])];
  return {
    score: ranked.score + MAP_EXPLORE_RECOMMEND_WEIGHTS.geoNearBoost,
    signals,
  };
};

export type MapExploreRecommendationBoosts = {
  friendOnOuting?: boolean;
  wishlistPlace?: boolean;
  wishlistDestination?: boolean;
  featuredPlace?: boolean;
};

export type MapExploreRecommendationScore = {
  score: number;
  signals: DiscoverRecommendationSignal[];
};

export const resolveExploreMapItemStartAtMs = (item: ExploreMapItemDTO): number | null => {
  const withStart = item as ExploreMapItemDTO & { startAt?: string | null };
  const raw = withStart.startAt ?? item.date ?? item.activity?.date ?? null;
  if (!raw?.trim()) return null;
  const iso = raw.includes('T') ? raw : `${raw.slice(0, 10)}T12:00:00.000Z`;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
};

export const isExcludedFromMapExploreRecommendations = (item: ExploreMapItemDTO): boolean => {
  if (exploreMapItemIsAvailabilityCatalog(item)) return true;
  return exploreMapItemIsRetiredSeekingActivity(item);
};

export const scoreMapExploreActivityCore = (input: {
  startAtMs: number;
  nowMs: number;
  participantCount: number;
  slotsAvailable: number | null;
  boosts?: MapExploreRecommendationBoosts;
  pin?: MapExploreViewerGeo | null;
  viewerGeo?: MapExploreViewerGeo | null;
}): MapExploreRecommendationScore | null => {
  const w = MAP_EXPLORE_RECOMMEND_WEIGHTS;
  const { startAtMs, nowMs, participantCount, slotsAvailable, boosts } = input;

  if (startAtMs < nowMs) return null;

  const signals: DiscoverRecommendationSignal[] = [];
  let score = w.activityBase;

  const daysOut = Math.floor((startAtMs - nowMs) / MAP_EXPLORE_RECOMMEND_MS_PER_DAY);
  score += Math.max(0, w.activityTimingCap - daysOut);
  if (daysOut <= w.activitySoonDays) signals.push('soon');

  if (participantCount > 0) {
    score += Math.min(participantCount, w.activityParticipantCap) * w.activityParticipantStep;
    signals.push('popular');
  }

  if (slotsAvailable != null && slotsAvailable > 0) {
    score += w.activitySlotsOpen;
    signals.push('spots_open');
  }

  if (boosts?.friendOnOuting) {
    score += w.friendOnOutingBoost;
    signals.push('buddies_joining');
  }
  if (boosts?.wishlistPlace) {
    score += w.activityWishlistPlace;
    signals.push('wishlist_place');
  } else if (boosts?.wishlistDestination) {
    score += w.activityWishlistArea;
    signals.push('wishlist_destination');
  }

  return applyMapExploreGeoBoost({ score, signals: [...new Set(signals)] }, input.pin, input.viewerGeo);
};

export const scoreMapExplorePlaceCore = (input: {
  boosts?: MapExploreRecommendationBoosts;
  rating?: number | null;
  pin?: MapExploreViewerGeo | null;
  viewerGeo?: MapExploreViewerGeo | null;
}): MapExploreRecommendationScore | null => {
  const w = MAP_EXPLORE_RECOMMEND_WEIGHTS;
  const signals: DiscoverRecommendationSignal[] = [];
  let score = w.placeBase;

  if (input.boosts?.featuredPlace) {
    score += w.placeFeatured;
    signals.push('popular');
  }

  if (input.rating != null && input.rating >= w.placeRatingThreshold) {
    score += w.placeRatingBoost;
  }

  if (input.boosts?.wishlistPlace) {
    score += w.placeWishlistPlace;
    signals.push('wishlist_place');
  } else if (input.boosts?.wishlistDestination) {
    score += w.placeWishlistArea;
    signals.push('wishlist_destination');
  }

  if (signals.length === 0 && !input.boosts?.featuredPlace) return null;

  return applyMapExploreGeoBoost({ score, signals: [...new Set(signals)] }, input.pin, input.viewerGeo);
};

export const scoreExploreMapCatalogItem = (
  item: ExploreMapItemDTO,
  nowMs: number = Date.now(),
  options?: {
    boosts?: MapExploreRecommendationBoosts;
    viewerGeo?: MapExploreViewerGeo | null;
  }
): MapExploreRecommendationScore | null => {
  const boosts = options?.boosts;
  const viewerGeo = options?.viewerGeo;
  const pin =
    item.latitude != null && item.longitude != null
      ? { lat: item.latitude, lng: item.longitude }
      : null;
  if (isExcludedFromMapExploreRecommendations(item)) return null;

  if (exploreMapItemIsHostedActivity(item)) {
    const startAtMs = resolveExploreMapItemStartAtMs(item);
    if (startAtMs == null) return null;
    const participantCount = item.participantPreviews?.length ?? 0;
    const slotsAvailable = item.slotsAvailable ?? null;
    return scoreMapExploreActivityCore({
      startAtMs,
      nowMs,
      participantCount,
      slotsAvailable,
      boosts,
      pin,
      viewerGeo,
    });
  }

  if (isGeographyMapSource(item.source)) {
    const rating = item.averageRating ?? (item as ExploreMapItemDTO & { rating?: number }).rating ?? null;
    const placeBoosts: MapExploreRecommendationBoosts = {
      ...boosts,
      featuredPlace: boosts?.featuredPlace ?? item.discoverFeatured === true,
    };
    return scoreMapExplorePlaceCore({ boosts: placeBoosts, rating, pin, viewerGeo });
  }

  if (item.source === 'shop') {
    return { score: MAP_EXPLORE_RECOMMEND_WEIGHTS.shopBase, signals: [] };
  }

  return null;
};

export const buildExploreMapRecommendationOrder = (
  items: ExploreMapItemDTO[],
  options?: { limit?: number; nowMs?: number; viewerGeo?: MapExploreViewerGeo | null }
): ExploreMapItemDTO[] => {
  const limit = options?.limit ?? 8;
  const nowMs = options?.nowMs ?? Date.now();

  return items
    .map((item) => {
      const ranked = scoreExploreMapCatalogItem(item, nowMs, { viewerGeo: options?.viewerGeo });
      return ranked ? { item, score: ranked.score } : null;
    })
    .filter((row): row is { item: ExploreMapItemDTO; score: number } => row != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.item);
};