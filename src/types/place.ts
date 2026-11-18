export type PlaceActivityType = 'hiking' | 'camping' | 'event';

export type PlaceDifficulty = 'easy' | 'moderate' | 'hard';
export type PlaceCampingType = 'self-guided' | 'operator-led';
export type PlaceAccessibility = 'car-accessible' | 'remote';
export type PlaceSeason = 'winter' | 'summer' | 'year-round';
import type { GeoRef } from '@uaetrail/shared-types';

export type PlaceRegion = 'Dubai' | 'RAK' | 'Fujairah' | 'Abu Dhabi' | 'Al Ain' | 'Sharjah';

/**
 * Unified place view — trail, camp, or event venue.
 * Replaces separate Trail / CampingSpot / CommunityActivitySpot view models.
 */
export interface Place {
  id: string;
  name: string;
  region: PlaceRegion;
  activityType: PlaceActivityType;
  description: string;
  images: string[];
  featured: boolean;
  difficulty?: PlaceDifficulty;
  distance?: number;
  duration?: number;
  elevation?: number;
  season?: PlaceSeason[];
  childFriendly?: boolean;
  campingType?: PlaceCampingType;
  maxGroupSize?: number;
  accessibility?: PlaceAccessibility;
  latitude?: number | null;
  longitude?: number | null;
  parkingLat?: number | null;
  parkingLng?: number | null;
  parkingLink?: string;
  highlights?: string[];
  surfaceType?: string[];
  tags?: string[];
  accessibleBy?: string[];
  status?: 'draft' | 'active' | 'inactive';
  areaId?: string | null;
  areaLabel?: string | null;
  areaSlug?: string | null;
  areaName?: string | null;
  geoRef?: GeoRef | null;
}

/** @deprecated Use Place — hiking venue view slice. */
export type PlaceAsTrail = Omit<Place, 'activityType' | 'campingType' | 'maxGroupSize' | 'accessibility'>;

/** @deprecated Use Place — camping venue view slice. */
export type PlaceAsCamp = Omit<
  Place,
  'activityType' | 'distance' | 'duration' | 'elevation' | 'childFriendly'
>;

/** @deprecated Use Place — event venue view slice. */
export type PlaceAsEvent = Omit<
  Place,
  'activityType' | 'campingType' | 'maxGroupSize' | 'accessibility' | 'childFriendly' | 'elevation'
>;
