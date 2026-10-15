/** Fallback outing cards for guest `/` when the public API is empty or unavailable. Copy: `homeMarketing.ts`. */

import { EXPLORE_MAP_PATH } from '../config/routingCatalog';

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
};

/** Curated fallback when public API is empty or unavailable. */
export const HOME_LANDING_FALLBACK_ACTIVITIES: HomeLandingActivity[] = [
  {
    id: 'fallback-jais',
    title: 'Jebel Jais sunrise hike',
    description: 'Sunrise hike on the UAE’s highest peak — host-led group with a clear meeting point.',
    region: 'RAK',
    date: '2026-10-11',
    time: '05:30',
    whenLabel: 'Sat at 5:30 AM',
    activityType: 'hiking',
    price: 0,
    pricingMode: 'free',
    path: EXPLORE_MAP_PATH,
  },
  {
    id: 'fallback-wadi',
    title: 'Wadi Shawka family camp',
    description: 'Weekend camp in the wadis — shared costs, family-friendly pace, group chat before go-day.',
    region: 'RAK',
    date: '2026-10-10',
    time: '16:00',
    whenLabel: 'Fri at 4:00 PM',
    activityType: 'camping',
    price: 45,
    pricingMode: 'shared',
    path: EXPLORE_MAP_PATH,
  },
  {
    id: 'fallback-dam',
    title: 'Hatta dam loop',
    description: 'Morning loop around Hatta Dam with a verified organizer — read the plan and request your spot.',
    region: 'Dubai',
    date: '2026-10-12',
    time: '07:00',
    whenLabel: 'Sun at 7:00 AM',
    activityType: 'hiking',
    price: 120,
    pricingMode: 'paid',
    path: EXPLORE_MAP_PATH,
  },
];
