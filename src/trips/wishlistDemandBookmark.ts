/**
 * Demand vs wishlist — do not mix.
 *
 * **Demand (Looking for):** Public participation on Explore (`participant_intents`).
 * Create, discover, message, host-fulfill — not stored as wishlist rows.
 *
 * **Wishlist:** Private venue + activity saves (`GET/POST /me/wishlist`) with optional
 * match alerts when new public plans appear nearby.
 */

import type { WishlistItemDTO } from '@uaetrail/shared-types';

/** Demand is never wishlist — API rejects demand targets on create. */
export const wishlistItemIsDemandBookmark = (_item: WishlistItemDTO): boolean => false;
