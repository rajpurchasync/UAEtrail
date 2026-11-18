import type { PlaceKind } from '@uaetrail/shared-types';
import type { MapPinKind, MapPinSource } from './mapPinTypes';

export interface PlaceMapPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  activityType: MapPinKind;
  path: string;
  hostAvatar?: string | null;
  source?: MapPinSource;
  activityMode?: 'hosted' | 'seeking';
  exploreItemId?: string;
  rideshareEndpoint?: 'from' | 'to';
  stackExploreItemIds?: string[];
  stackCount?: number;
  colocatedEntries?: ColocatedMapPinEntry[];
  placeKind?: PlaceKind;
  /** ISO date (YYYY-MM-DD) for hosted / seeking outing pins — map hover tooltip. */
  scheduleDate?: string | null;
  /** Upcoming hosted outings at this catalog place (venue pins). */
  hostedTripCount?: number;
  /** Spot / venue name for trip pin captions (≤2 words on map). */
  venueName?: string | null;
  /** @deprecated Prefer `venueName` for trip captions. */
  placeHub?: string | null;
  /** Catalog place cover for geography map circles. */
  pinCoverImage?: string | null;
}

export interface ColocatedMapPinEntry {
  activityType: MapPinKind;
  source?: MapPinSource;
  activityMode?: 'hosted' | 'seeking';
  exploreItemId: string;
  stackExploreItemIds?: string[];
  stackCount?: number;
}

export interface MapBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export type { MapPinKind, MapPinSource };
