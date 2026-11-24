/**
 * Wishlist display helpers.
 *
 * Seeking posts (`activityMode: seeking`) are public map participation — never wishlist rows.
 * Wishlist is private venue + activity saves (`GET/POST /me/wishlist`) with optional nearby alerts.
 */

import type { DiscoveryCardKind, WishlistItemDTO } from '@uaetrail/shared-types';
import {
  activityDetailPath,
  destinationHubPath,
  placeDetailPathForId,
  resolveMapPinEmoji,
} from '@uaetrail/shared-types';

const discoveryKindFromStoredActivityType = (activityType: string): DiscoveryCardKind | null => {
  const kind = activityType.toLowerCase();
  if (kind === 'hiking' || kind === 'camping' || kind === 'event' || kind === 'rideshare' || kind === 'shop') {
    return kind;
  }
  if (kind === 'community_activity') return 'event';
  return null;
};

export const wishlistItemPinEmoji = (item: WishlistItemDTO): string => {
  if (item.areaId) return '🗺️';
  const stored = item.activityId ? item.activity?.activityType : item.location?.activityType;
  if (!stored) return '';
  const kind = discoveryKindFromStoredActivityType(stored);
  if (!kind) return '';
  return resolveMapPinEmoji(kind, item.activityId ? 'activity' : 'venue');
};

export const wishlistItemTitle = (item: WishlistItemDTO): string => {
  const fromActivity = item.activity?.title?.trim();
  if (fromActivity) return fromActivity;
  const fromPlace = item.location?.name?.trim();
  if (fromPlace) return fromPlace;
  const fromArea = item.area?.name?.trim();
  if (fromArea) return fromArea;
  return 'Saved item';
};

export const resolveWishlistItemPath = (item: WishlistItemDTO): string | null => {
  if (item.activityId) return activityDetailPath(item.activityId);
  if (item.areaId && item.area?.slug) return destinationHubPath(item.area.slug);
  if (item.locationId) {
    return placeDetailPathForId(item.locationId, item.location?.activityType);
  }
  return null;
};
