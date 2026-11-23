import type { ExploreMapSourceWire } from './wire-lexicon.js';

export const DISCOVER_RECOMMENDATIONS_SCHEMA_VERSION = 1 as const;

export type DiscoverRecommendationSurface = 'map' | 'crew';

export type DiscoverCrewRecommendationBucket =
  | 'friends_going'
  | 'hosts_going'
  | 'availability'
  | 'directory';

export type DiscoverRecommendationSignal =
  | 'soon'
  | 'buddies_joining'
  | 'spots_open'
  | 'popular'
  | 'wishlist_place'
  | 'wishlist_area'
  | 'near_you';

/** One ranked row for a Discover surface — refs map catalog ids (`activity:…`). */
export type DiscoverMapRecommendationRowDTO = {
  exploreItemId: string;
  source: ExploreMapSourceWire;
  title: string;
  startAt: string | null;
  score: number;
  signals: DiscoverRecommendationSignal[];
};

export type DiscoverMapRecommendationsDTO = {
  schemaVersion: typeof DISCOVER_RECOMMENDATIONS_SCHEMA_VERSION;
  surface: 'map';
  rows: DiscoverMapRecommendationRowDTO[];
};

export type DiscoverCrewRecommendationRowDTO = {
  userId: string;
  bucket: DiscoverCrewRecommendationBucket;
  score: number;
};

export type DiscoverCrewRecommendationsDTO = {
  schemaVersion: typeof DISCOVER_RECOMMENDATIONS_SCHEMA_VERSION;
  surface: 'crew';
  rows: DiscoverCrewRecommendationRowDTO[];
};