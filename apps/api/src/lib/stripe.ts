import { ApiError } from './api-error.js';

let stripeClient: import('stripe').default | null = null;

export const isStripeConfigured = (): boolean => Boolean(process.env.STRIPE_SECRET_KEY);

export async function getStripe(): Promise<import('stripe').default> {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new ApiError(
      503,
      'stripe_not_configured',
      'Online checkout is not available yet. Use the partner buy link or contact support.'
    );
  }
  if (!stripeClient) {
    const Stripe = (await import('stripe')).default;
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}
