/** Guest home activity rail shape — populated only from `GET /activities` (no static outings). */

export type HomeLandingActivity = {
  id: string;
  title: string;
  description?: string | null;
  region: string;
  /** ISO date (YYYY-MM-DD) for formatActivityTime */
  date: string;
  time?: string | null;
  whenLabel: string;
  activityType: 'hiking' | 'camping' | 'event' | 'rideshare';
  price: number;
  paymentTerms?: string | null;
  pricingMode?: 'free' | 'shared' | 'paid' | null;
  path: string;
  /** Wire image from activity or linked place — stock cover only when absent. */
  coverImageUrl: string;
};