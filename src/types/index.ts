export type ActivityType = 'hiking' | 'camping';
export type DifficultyLevel = 'easy' | 'moderate' | 'hard';
export type CampingType = 'self-guided' | 'operator-led';
export type Accessibility = 'car-accessible' | 'remote';
export type Season = 'winter' | 'summer' | 'year-round';
export type TripStatus = 'free' | 'paid' | 'full';
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
}

export interface Operator {
  id: string;
  name: string;
  bio: string;
  experience: string;
  languages: string[];
  certifications: string[];
  activityTypes: ActivityType[];
  avatar: string;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
}

export interface Trip {
  id: string;
  locationId: string;
  locationName: string;
  region?: UAERegion | string;
  activityType: ActivityType;
  date: string;
  time: string;
  operatorId: string;
  organizerName?: string;
  organizerAvatar?: string;
  price: number;
  slotsAvailable: number;
  slotsTotal: number;
  status: TripStatus;
  participantIds: string[];
  meetingPoint?: string;
  itinerary?: string[];
  requirements?: string[];
  carpoolAvailable?: boolean;
}

export interface GearItem {
  id: string;
  name: string;
  category: ActivityType;
  subcategory: string;
  price: number;
  image: string;
  affiliateLink: string;
  featured: boolean;
  description: string;
}

export interface Review {
  id: string;
  locationId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}
