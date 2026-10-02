/**
 * Demand vs wishlist — do not mix.
 *
 * **Demand (Looking for):** Public participation on Explore (`participant_intents`).
 * Create, discover, message, host-fulfill — not stored as personal wishlist rows.
 *
 * **Wishlist:** Private intent on `user_favorites` (places, shops, outings to join)
 * + optional match alerts when new public plans appear nearby. Notifications only;
 * never shown as a public map pin.
 */

import type { FavoriteDTO } from '@uaetrail/shared-types';

/** Bookmark of someone else's demand post — not personal wishlist. */
export const favoriteIsDemandBookmark = (item: FavoriteDTO): boolean =>
  Boolean(item.participantIntentId || item.participantIntent);
