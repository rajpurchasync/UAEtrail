import {
  approximateDestinationBoundsKm2,
  pointInDestinationBounds,
  resolveDestinationId,
  type DestinationBoundsRing,
  type DestinationDTO,
} from '@uaetrail/shared-types';
import type { Location } from '../domain/types.js';
import type { MongoActivityDoc } from './entity-builders.js';
import { listPublishedDestinations } from './destinations-store.js';
import { resolveCatalogLocationDestinationId } from './venue-catalog-enrichment.js';

let publishedDestinationsCache: DestinationDTO[] | null = null;
let publishedDestinationsCacheAt = 0;
const CACHE_MS = 60_000;

const loadPublishedDestinations = async (): Promise<DestinationDTO[]> => {
  const now = Date.now();
  if (publishedDestinationsCache && now - publishedDestinationsCacheAt < CACHE_MS) {
    return publishedDestinationsCache;
  }
  publishedDestinationsCache = await listPublishedDestinations();
  publishedDestinationsCacheAt = now;
  return publishedDestinationsCache;
};

export const invalidatePublishedDestinationsCache = (): void => {
  publishedDestinationsCache = null;
  publishedDestinationsCacheAt = 0;
};

export const resolveDestinationIdFromPoint = (
  latitude: number,
  longitude: number,
  destinations: DestinationDTO[],
  preferredDestinationId?: string | null
): string | null => {
  if (preferredDestinationId) return preferredDestinationId;
  const hits = destinations.filter((row) => pointInDestinationBounds(latitude, longitude, row.bounds));
  if (hits.length === 0) return null;
  hits.sort((a, b) => {
    const priorityDiff = a.priority - b.priority;
    if (priorityDiff !== 0) return priorityDiff;
    return approximateDestinationBoundsKm2(a.bounds) - approximateDestinationBoundsKm2(b.bounds);
  });
  return hits[0].id;
};

export const resolveDestinationIdForCoordinates = async (
  latitude: number,
  longitude: number,
  preferredDestinationId?: string | null
): Promise<string | null> => {
  const destinations = await loadPublishedDestinations();
  return resolveDestinationIdFromPoint(latitude, longitude, destinations, preferredDestinationId);
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
 * Audit-only: persisted `destinationId`, seed map, then point-in-polygon.
 * Request and publish paths must not call this — missing `destinationId` is a data fix.
 */
export const resolveEffectiveCatalogDestinationId = (
  location: Pick<Location, 'id' | 'destinationId' | 'latitude' | 'longitude'>,
  destinations: DestinationDTO[]
): string | null => {
  if (location.destinationId?.trim()) return location.destinationId.trim();
  const catalogDestinationId = resolveCatalogLocationDestinationId(location.id);
  if (catalogDestinationId) return catalogDestinationId;
  if (location.latitude != null && location.longitude != null) {
    return resolveDestinationIdFromPoint(location.latitude, location.longitude, destinations, null);
  }
  return null;
};

/** Geography for an activity is the host place row only (`location.destinationId`). */
export const resolveDestinationIdForActivity = (
  _activity: Pick<MongoActivityDoc, 'destinationId'>,
  location?: Pick<Location, 'destinationId'> | null
): string | null => resolveDestinationId(location);

/** Public publish destination — `place.destinationId` only (no denormalized activity field). */
export const resolveDestinationIdForActivityPublish = async (
  activity: MongoActivityDoc,
  location?: Location | null
): Promise<string | null> => Promise.resolve(resolveDestinationIdForActivity(activity, location));

export const ringFromBBox = (
  south: number,
  west: number,
  north: number,
  east: number
): DestinationBoundsRing => [
  { latitude: south, longitude: west },
  { latitude: south, longitude: east },
  { latitude: north, longitude: east },
  { latitude: north, longitude: west },
];