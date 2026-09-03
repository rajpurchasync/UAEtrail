import type { AuthUser } from '@uaetrail/shared-types';

import type { ActivityType } from '../../config/activityTypes';
import type { TripPricePackage } from '../../utils/tripPricing';

export const emptyForm = {
  activityType: 'hiking' as ActivityType,
  locationId: '',
  title: '',
  description: '',
  date: '',
  time: '',
  endDate: '',
  endTime: '',
  capacity: 10,
  pricing: 'free' as 'free' | 'paid',
  price: 0,
  pricePackages: [] as TripPricePackage[],
  meetingPoint: '',
  meetingLat: '',
  meetingLng: '',
  paymentTerms: '',
  itinerary: '',
  requirements: '',
  images: [] as string[],
  hostUserId: '',
};

export type PageTab = 'explore' | 'mine';

/** Participant dashboard tab on /activities (joined trips + requests). */
export const parseTabParam = (value: string | null, user: AuthUser | null): PageTab => {
  if ((value === 'mine' || value === 'joined') && user) return 'mine';
  return 'explore';
};
