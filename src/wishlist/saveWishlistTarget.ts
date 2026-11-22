import type { WishlistItemDTO } from '@uaetrail/shared-types';
import {
  addWishlistTarget,
  type WishlistTarget,
} from '../hooks/wishlistClientApi';

/** Catalog / Plan save payloads — not compose wire. */
export type WishlistSaveVenueInput = {
  kind: 'venue';
  locationId: string;
  alertOnMatch?: boolean;
  watchOutingCategory?: string | null;
  watchLatitude?: number | null;
  watchLongitude?: number | null;
};

export type WishlistSaveAreaInput = {
  kind: 'area';
  areaId: string;
  alertOnMatch?: boolean;
  watchOutingCategory?: string | null;
};

export type WishlistSaveActivityInput = {
  kind: 'activity';
  activityId: string;
  alertOnMatch?: boolean;
};

export type WishlistSaveInput =
  | WishlistSaveVenueInput
  | WishlistSaveAreaInput
  | WishlistSaveActivityInput;

export const wishlistSaveInputToTarget = (input: WishlistSaveInput): WishlistTarget => {
  switch (input.kind) {
    case 'venue':
      return {
        locationId: input.locationId,
        alertOnMatch: input.alertOnMatch,
        watchOutingCategory: input.watchOutingCategory,
        watchLatitude: input.watchLatitude,
        watchLongitude: input.watchLongitude,
      };
    case 'area':
      return {
        areaId: input.areaId,
        alertOnMatch: input.alertOnMatch,
        watchOutingCategory: input.watchOutingCategory,
      };
    case 'activity':
      return {
        activityId: input.activityId,
        alertOnMatch: input.alertOnMatch,
      };
    default:
      throw new Error('Unknown wishlist save kind');
  }
};

/** Product write facade — `POST /me/wishlist` only (peek, Plan picker, explore save). */
export const saveWishlistTarget = async (input: WishlistSaveInput): Promise<WishlistItemDTO> =>
  addWishlistTarget(wishlistSaveInputToTarget(input));

/** Explore cards already resolve a {@link WishlistTarget} — still routes through the facade. */
export const saveWishlistFromResolvedTarget = async (
  target: WishlistTarget
): Promise<WishlistItemDTO> => addWishlistTarget(target);