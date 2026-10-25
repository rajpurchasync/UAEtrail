import {
  approximateAreaBoundsKm2,
  pointInAreaBounds,
  type AreaBoundsRing,
  type AreaDTO,
} from '@uaetrail/shared-types';
import type { Location } from '../domain/types.js';
import type { MongoActivityDoc } from './entity-builders.js';
import { listPublishedAreas } from './areas-store.js';
import { resolveCatalogLocationAreaId } from './venue-catalog-enrichment.js';

let publishedAreasCache: AreaDTO[] | null = null;
let publishedAreasCacheAt = 0;
const CACHE_MS = 60_000;

const loadPublishedAreas = async (): Promise<AreaDTO[]> => {
  const now = Date.now();
  if (publishedAreasCache && now - publishedAreasCacheAt < CACHE_MS) {
    return publishedAreasCache;
  }
  publishedAreasCache = await listPublishedAreas();
  publishedAreasCacheAt = now;
  return publishedAreasCache;
};

export const invalidatePublishedAreasCache = (): void => {
  publishedAreasCache = null;
  publishedAreasCacheAt = 0;
};

export const resolveAreaIdFromPoint = (
  latitude: number,
  longitude: number,
  areas: AreaDTO[],
  placeAreaId?: string | null
): string | null => {
  if (placeAreaId) return placeAreaId;
  const hits = areas.filter((area) => pointInAreaBounds(latitude, longitude, area.bounds));
  if (hits.length === 0) return null;
  hits.sort((a, b) => {
    const priorityDiff = a.priority - b.priority;
    if (priorityDiff !== 0) return priorityDiff;
    return approximateAreaBoundsKm2(a.bounds) - approximateAreaBoundsKm2(b.bounds);
  });
  return hits[0].id;
};

export const resolveAreaIdForCoordinates = async (
  latitude: number,
  longitude: number,
  placeAreaId?: string | null
): Promise<string | null> => {
  const areas = await loadPublishedAreas();
  return resolveAreaIdFromPoint(latitude, longitude, areas, placeAreaId);
};

export const resolveActivityAnchorCoordinates = (
  activity: Pick<
    MongoActivityDoc,
    | 'meetingLat'
    | 'meetingLng'
    | 'startLat'
    | 'startLng'
    | 'parkingLat'
    | 'parkingLng'
  >,
  location?: Pick<Location, 'latitude' | 'longitude'> | null
): { latitude: number; longitude: number } | null => {
  const latitude =
    activity.meetingLat ??
    activity.startLat ??
    activity.parkingLat ??
    location?.latitude ??
    null;
  const longitude =
    activity.meetingLng ??
    activity.startLng ??
    activity.parkingLng ??
    location?.longitude ??
    null;
  if (latitude == null || longitude == null) return null;
  return { latitude, longitude };
};

/**
 * Audit-only: persisted `areaId`, then seed map, then point-in-polygon.
 * Request and publish paths must not call this — missing `areaId` is a data fix (`backfill-location-area-ids`).
 */
export const resolveEffectiveLocationAreaId = (
  location: Pick<Location, 'id' | 'areaId' | 'latitude' | 'longitude'>,
  areas: AreaDTO[]
): string | null => {
  if (location.areaId?.trim()) return location.areaId.trim();
  const catalogAreaId = resolveCatalogLocationAreaId(location.id);
  if (catalogAreaId) return catalogAreaId;
  if (location.latitude != null && location.longitude != null) {
    return resolveAreaIdFromPoint(location.latitude, location.longitude, areas, null);
  }
  return null;
};

/** Geography for an activity is the persisted place `areaId`, then the activity row. */
export const resolveAreaIdForActivity = (
  activity: Pick<MongoActivityDoc, 'areaId'>,
  location?: Pick<Location, 'areaId'> | null
): string | null => {
  if (location?.areaId?.trim()) return location.areaId.trim();
  if (activity.areaId?.trim()) return activity.areaId.trim();
  return null;
};

/** Public publish area — persisted place or activity `areaId` only. */
export const resolveAreaIdForActivityPublish = async (
  activity: MongoActivityDoc,
  location?: Location | null
): Promise<string | null> => Promise.resolve(resolveAreaIdForActivity(activity, location));

export const ringFromBBox = (
  south: number,
  west: number,
  north: number,
  east: number
): AreaBoundsRing => [
  { latitude: south, longitude: west },
  { latitude: south, longitude: east },
  { latitude: north, longitude: east },
  { latitude: north, longitude: west },
];
