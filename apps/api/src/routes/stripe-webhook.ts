import type { Request, Response, NextFunction } from 'express';
import { getStripe, isStripeConfigured } from '../lib/stripe.js';
import { ApiError } from '../lib/api-error.js';
import {
  finalizeStripeWebhookEvent,
  isStripeWebhookEventProcessed,
  processStripeCheckoutSessionCompleted,
} from '../services/stripe-checkout-webhook-commands.js';

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

    const alreadyProcessed = await isStripeWebhookEventProcessed(event.id);
    if (alreadyProcessed) {
      res.json({ received: true, duplicate: true });
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as import('stripe').Stripe.Checkout.Session;
      const result = await processStripeCheckoutSessionCompleted(session);
      if (result.skipped) {
        await finalizeStripeWebhookEvent(event.id);
        res.json({ received: true, skipped: result.skipped });
        return;
      }
    }

    await finalizeStripeWebhookEvent(event.id);

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};
