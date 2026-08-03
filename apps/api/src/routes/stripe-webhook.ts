import type { Request, Response, NextFunction } from 'express';
import { LocationUnlockSource, OrderStatus } from '../domain/enums.js';
import { getStripe, isStripeConfigured } from '../lib/stripe.js';
import { ApiError } from '../lib/api-error.js';
import { findLocationInMongo } from '../lib/entity-sync.js';
import {
  findShopOrderById,
  hasProcessedStripeWebhookEvent,
  markShopOrderPaid,
  recordStripeWebhookEvent
} from '../lib/shop-store.js';
import { unlockLocationForUser } from '../services/location-premium.js';

const aedToStripeMinorUnits = (amountAed: number): number => Math.round(amountAed * 100);

/** Stripe webhook — must be mounted with express.raw() before express.json(). */
export const stripeWebhookHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isStripeConfigured()) {
      res.status(503).json({ error: 'stripe_not_configured' });
      return;
    }

    const stripe = await getStripe();
    const sig = req.headers['stripe-signature'] as string | undefined;
    const rawBody = req.body as Buffer;

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new ApiError(400, 'missing_signature', 'Webhook signature required.');
    }

    const event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);

    const alreadyProcessed = await hasProcessedStripeWebhookEvent(event.id);
    if (alreadyProcessed) {
      res.json({ received: true, duplicate: true });
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as import('stripe').Stripe.Checkout.Session;

      if (session.payment_status !== 'paid') {
        await recordStripeWebhookEvent(event.id);
        res.json({ received: true, skipped: 'payment_not_paid' });
        return;
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
      } else {
        const orderId = session.metadata?.orderId ?? session.client_reference_id;
        if (orderId) {
          const order = await findShopOrderById(orderId);
          if (order && order.status === OrderStatus.PENDING) {
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
          }
        }
      }
    }

    await recordStripeWebhookEvent(event.id);

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};
