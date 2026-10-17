import { ActivityType, LocationUnlockSource, UserRole } from '../domain/enums.js';
import { env } from '../config/env.js';
import { ApiError } from '../lib/api-error.js';
import { findActiveLocationById } from '../lib/activities-store.js';
import { getStripe, isStripeConfigured } from '../lib/stripe.js';
import {
  buildPremiumSummary,
  checkPremiumAccess,
  locationHasPremiumContent,
  unlockLocationForUser,
} from './location-premium.js';
const publicPlaceDetailPath = (location: { id: string; activityType: ActivityType }) => {
  if (location.activityType === ActivityType.SHOP) return `/shop/${location.id}`;
  if (location.activityType === ActivityType.CAMPING) return `/camp/${location.id}`;
  if (
    location.activityType === ActivityType.EVENT ||
    location.activityType === ActivityType.COMMUNITY_ACTIVITY
  ) {
    return `/venue/${location.id}`;
  }
  return `/trail/${location.id}`;
};

export const createPublicPlacePremiumCheckout = async (input: {
  placeId: string;
  userId: string;
  userRole: UserRole;
}) => {
  const location = await findActiveLocationById(input.placeId);
  if (!location) {
    throw new ApiError(404, 'location_not_found', 'Location not found.');
  }
  if (!locationHasPremiumContent(location)) {
    throw new ApiError(400, 'no_premium_content', 'This location has no premium map or guide content.');
  }

  const access = await checkPremiumAccess(input.userId, input.placeId, input.userRole);
  if (access.hasAccess) {
    return {
      kind: 'already_unlocked' as const,
      alreadyUnlocked: true,
      premium: buildPremiumSummary(location, access),
    };
  }

  if (location.unlockPriceAed === 0) {
    const unlocked = await unlockLocationForUser(input.userId, input.placeId, LocationUnlockSource.PURCHASE);
    return {
      kind: 'free_unlock' as const,
      alreadyUnlocked: false,
      premium: buildPremiumSummary(location, unlocked),
      message: 'Location unlocked. Map and guide access is now available.',
    };
  }

  if (!isStripeConfigured()) {
    throw new ApiError(
      503,
      'checkout_unavailable',
      'Online payment is not available yet. Try again later or upgrade to Pro/GOAT membership.'
    );
  }

  const stripe = await getStripe();
  const returnPath = publicPlaceDetailPath(location);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${env.APP_BASE_URL}${returnPath}?unlock=success`,
    cancel_url: `${env.APP_BASE_URL}${returnPath}?unlock=cancelled`,
    client_reference_id: `${input.userId}:${input.placeId}`,
    metadata: {
      type: 'location_unlock',
      userId: input.userId,
      locationId: input.placeId,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'aed',
          unit_amount: location.unlockPriceAed * 100,
          product_data: {
            name: `${location.name} — premium access`,
            description: 'One-time unlock: route map and guide for this location.',
          },
        },
      },
    ],
  });

  return {
    kind: 'stripe_session' as const,
    sessionId: session.id,
    url: session.url,
  };
};
