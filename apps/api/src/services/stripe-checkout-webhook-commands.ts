import type Stripe from 'stripe';
import { LocationUnlockSource, OrderStatus } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { findLocationInMongo } from '../lib/entity-sync.js';
import {
  findShopOrderById,
  hasProcessedStripeWebhookEvent,
  markShopOrderPaid,
  recordStripeWebhookEvent,
} from '../lib/shop-store.js';
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

  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId) {
    return {};
  }

  const order = await findShopOrderById(orderId);
  if (!order || order.status !== OrderStatus.PENDING) {
    return {};
  }

  if (order.stripeSessionId && order.stripeSessionId !== session.id) {
    throw new ApiError(400, 'session_mismatch', 'Stripe session does not match order.');
  }
  const expectedAmount = aedToStripeMinorUnits(order.totalAed);
  if (session.amount_total !== expectedAmount) {
    throw new ApiError(400, 'payment_amount_mismatch', 'Order payment amount mismatch.');
  }
  if (session.metadata?.userId && session.metadata.userId !== order.userId) {
    throw new ApiError(400, 'user_mismatch', 'Order user does not match payment metadata.');
  }

  await markShopOrderPaid(orderId);
  return {};
};
