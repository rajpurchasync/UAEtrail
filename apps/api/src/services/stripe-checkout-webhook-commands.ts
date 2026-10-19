import type Stripe from 'stripe';
import { LocationUnlockSource } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { findLocationInMongo } from '../lib/entity-sync.js';
import { hasProcessedStripeWebhookEvent, recordStripeWebhookEvent } from '../lib/shop-store.js';
import { unlockLocationForUser } from './location-premium.js';

const aedToStripeMinorUnits = (amountAed: number): number => Math.round(amountAed * 100);

export const isStripeWebhookEventProcessed = (eventId: string) =>
  hasProcessedStripeWebhookEvent(eventId);

export const finalizeStripeWebhookEvent = (eventId: string) => recordStripeWebhookEvent(eventId);

export const processStripeCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session
): Promise<{ skipped?: string }> => {
  if (session.payment_status !== 'paid') {
    return { skipped: 'payment_not_paid' };
  }

  if (session.metadata?.type === 'location_unlock') {
    const userId = session.metadata.userId;
    const locationId = session.metadata.locationId;
    if (userId && locationId) {
      const location = await findLocationInMongo(locationId);
      if (!location) {
        throw new ApiError(400, 'location_not_found', 'Location not found for unlock.');
      }
      const expectedAmount = aedToStripeMinorUnits(location.unlockPriceAed);
      if (session.amount_total !== expectedAmount) {
        throw new ApiError(400, 'payment_amount_mismatch', 'Unlock payment amount mismatch.');
      }
      await unlockLocationForUser(userId, locationId, LocationUnlockSource.PURCHASE);
    }
    return {};
  }

  return {};
};
