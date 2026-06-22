import type { Request, Response, NextFunction } from 'express';
import { LocationUnlockSource, OrderStatus } from '@prisma/client';
import { getStripe, isStripeConfigured } from '../lib/stripe.js';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/api-error.js';
import { unlockLocationForUser } from '../services/location-premium.js';

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
    let event: import('stripe').Stripe.Event;

    if (sig && process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else if (process.env.NODE_ENV !== 'production') {
      event = JSON.parse(rawBody.toString('utf8')) as import('stripe').Stripe.Event;
    } else {
      throw new ApiError(400, 'missing_signature', 'Webhook signature required.');
    }

    const alreadyProcessed = await prisma.stripeWebhookEvent.findUnique({ where: { id: event.id } });
    if (alreadyProcessed) {
      res.json({ received: true, duplicate: true });
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as import('stripe').Stripe.Checkout.Session;

      if (session.metadata?.type === 'location_unlock') {
        const userId = session.metadata.userId;
        const locationId = session.metadata.locationId;
        if (userId && locationId) {
          await unlockLocationForUser(userId, locationId, LocationUnlockSource.PURCHASE);
        }
      } else {
        const orderId = session.metadata?.orderId ?? session.client_reference_id;
        if (orderId) {
          const order = await prisma.shopOrder.findUnique({ where: { id: orderId } });
          if (order && order.status === OrderStatus.PENDING) {
            await prisma.shopOrder.update({
              where: { id: orderId },
              data: { status: OrderStatus.PAID }
            });
          }
        }
      }
    }

    await prisma.stripeWebhookEvent.create({ data: { id: event.id } });

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};
