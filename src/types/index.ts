export type ActivityType = 'hiking' | 'camping' | 'event' | 'carpool';
export type DifficultyLevel = 'easy' | 'moderate' | 'hard';
export type CampingType = 'self-guided' | 'operator-led';
export type Accessibility = 'car-accessible' | 'remote';
export type Season = 'winter' | 'summer' | 'year-round';
export type ActivityListingStatus = 'free' | 'paid' | 'full';

export type UAERegion = 'Dubai' | 'RAK' | 'Fujairah' | 'Abu Dhabi' | 'Al Ain' | 'Sharjah';

export interface Trail {
  id: string;
  name: string;
  region: UAERegion;
  difficulty: DifficultyLevel;
  distance: number;
  duration: number;
  elevation: number;
  season: Season[];
  childFriendly: boolean;
  description: string;
  images: string[];
  featured: boolean;
  latitude?: number | null;
  longitude?: number | null;
  parkingLink?: string;
  highlights?: string[];
  surfaceType?: string[];
  tags?: string[];
  accessibleBy?: string[];
}

export interface CampingSpot {
  id: string;
  name: string;
  region: UAERegion;
  campingType: CampingType;
  season: Season[];
  maxGroupSize: number;
  accessibility: Accessibility;
  difficulty?: DifficultyLevel;
  description: string;
  images: string[];
  featured: boolean;
  latitude?: number | null;
  longitude?: number | null;
  parkingLink?: string;
  highlights?: string[];
  surfaceType?: string[];
  tags?: string[];
  accessibleBy?: string[];
}

export interface CommunityActivitySpot {
  id: string;
  name: string;
  region: UAERegion;
  difficulty: DifficultyLevel;
  distance?: number;
  duration?: number;
  season: Season[];
  description: string;
  images: string[];
  featured: boolean;
  latitude?: number | null;
  longitude?: number | null;
  parkingLink?: string;
  highlights?: string[];
  surfaceType?: string[];
  tags?: string[];
  accessibleBy?: string[];
}

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
  pricePackages?: Array<{ label: string; amount: number; currency: string }>;
  pricingMode?: 'free' | 'shared' | 'paid' | null;
  slotsAvailable: number;
  slotsTotal: number;
  status: ActivityListingStatus;
  participantIds: string[];
  participantPreviews?: Array<{ id: string; name: string; avatar?: string | null }>;
  meetingPoint?: string;
  itinerary?: string[];
  requirements?: string[];
  carpoolAvailable?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}
