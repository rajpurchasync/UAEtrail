export type ActivityType = 'hiking' | 'camping' | 'event' | 'rideshare';
export type DifficultyLevel = 'easy' | 'moderate' | 'hard';
export type CampingType = 'self-guided' | 'operator-led';
export type Accessibility = 'car-accessible' | 'remote';
export type Season = 'winter' | 'summer' | 'year-round';
/** @deprecated Use deriveActivityAvailability from @uaetrail/shared-types */
export type ActivityListingStatus = 'free' | 'paid' | 'full';

export type UAERegion = 'Dubai' | 'RAK' | 'Fujairah' | 'Abu Dhabi' | 'Al Ain' | 'Sharjah';

export type { Place, PlaceActivityType, PlaceRegion, PlaceAsTrail, PlaceAsCamp, PlaceAsEvent } from './place';

/** @deprecated Use {@link Place} with `activityType: 'hiking'`. */
export type Trail = import('./place').PlaceAsTrail;

/** @deprecated Use ActivityDTO from @uaetrail/shared-types */
export interface ActivityListing {
  id: string;
  locationId: string;
  locationName: string;
  title?: string;
  description?: string;
  region?: UAERegion | string;
  activityType: ActivityType;
  date: string;
  time: string;
  operatorId: string;
  tenantSlug?: string;
  tenantName?: string;
  hostName?: string;
  hostUserId?: string;
  hostAvatar?: string;
  images?: string[];
  price: number;
  pricingMode?: 'free' | 'shared' | 'paid' | null;
  slotsAvailable: number;
  slotsTotal: number;
  status: ActivityListingStatus;
  participantIds: string[];
  participantPreviews?: Array<{ id: string; name: string; avatar?: string | null }>;
  meetingPoint?: string;
  itinerary?: string[];
  requirements?: string[];
  rideshareAvailable?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

/** @deprecated Use {@link Place} with `activityType: 'camping'`. */
export type CampingSpot = import('./place').PlaceAsCamp;

/** @deprecated Use {@link Place} with `activityType: 'event'`. */
export type CommunityActivitySpot = import('./place').PlaceAsEvent;
