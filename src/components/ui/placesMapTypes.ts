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
