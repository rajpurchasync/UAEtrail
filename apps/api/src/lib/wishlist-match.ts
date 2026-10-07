import type { ExplorePlanComposeIntent, OutingCategory } from '@uaetrail/shared-types';
import { distanceKm } from './geo-distance.js';

export const WISHLIST_MATCH_RADIUS_KM = 45;

export type WishlistWatchRow = {
  userId: string;
  wishlistItemId: string;
  alertOnMatch: boolean;
  watchOutingCategory: OutingCategory | null;
  watchLatitude: number | null;
  watchLongitude: number | null;
};

export type WishlistPinEvent = {
  composeIntent: ExplorePlanComposeIntent;
  outingCategory: OutingCategory | null;
  latitude: number | null;
  longitude: number | null;
  actorUserId: string;
};

export const wishlistWatchMatchesPin = (
  watch: WishlistWatchRow,
  event: WishlistPinEvent,
  radiusKm: number = WISHLIST_MATCH_RADIUS_KM
): boolean => {
  if (!watch.alertOnMatch) return false;
  if (watch.userId === event.actorUserId) return false;
  if (!event.outingCategory) return false;

  if (watch.watchOutingCategory && watch.watchOutingCategory !== event.outingCategory) {
    return false;
  }

  const hasWatchGeo = watch.watchLatitude != null && watch.watchLongitude != null;
  const hasEventGeo = event.latitude != null && event.longitude != null;

  if (!hasWatchGeo || !hasEventGeo) {
    return Boolean(watch.watchOutingCategory && watch.watchOutingCategory === event.outingCategory);
  }

  return (
    distanceKm(watch.watchLatitude!, watch.watchLongitude!, event.latitude!, event.longitude!) <= radiusKm
  );
};
