import {
  RIDESHARE_DESTINATION_PLACE_PREFIX,
  RIDESHARE_PENDING_DESTINATION_PLACE_PREFIX,
  resolveActivityDestinationCoordinates,
  type PlaceReachableRideRowDTO,
  type PlaceReachableRidesResponse,
} from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { findActiveLocationById } from '../lib/activities-store.js';
import { distanceKm } from '../lib/geo-distance.js';
import { buildActivityDto } from '../lib/mappers.js';
import { listPublishedReachableRidesByPlaceFromMongo } from '../lib/activity-read-assembler.js';

const MAX_PAGE_SIZE = 10;

const placeAnchorCoords = (location: {
  latitude?: number | null;
  longitude?: number | null;
  parkingLat?: number | null;
  parkingLng?: number | null;
}): { lat: number; lng: number } | null => {
  const lat = location.latitude ?? location.parkingLat ?? null;
  const lng = location.longitude ?? location.parkingLng ?? null;
  if (lat == null || lng == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
    return null;
  }
  return { lat: Number(lat), lng: Number(lng) };
};

const rideDestinationDistanceKm = (
  anchor: { lat: number; lng: number },
  activity: ReturnType<typeof buildActivityDto>
): number | null => {
  const dest = resolveActivityDestinationCoordinates(activity);
  if (dest.latitude == null || dest.longitude == null) return null;
  const km = distanceKm(anchor.lat, anchor.lng, dest.latitude, dest.longitude);
  return Math.round(km * 10) / 10;
};

export const listPublicPlaceReachableRides = async (input: {
  placeId: string;
  page: number;
  pageSize: number;
}): Promise<PlaceReachableRidesResponse> => {
  const location = await findActiveLocationById(input.placeId);
  if (!location) {
    throw new ApiError(404, 'location_not_found', 'Location not found.');
  }

  const page = Math.max(1, input.page);
  const pageSize = Math.min(Math.max(1, input.pageSize), MAX_PAGE_SIZE);
  const anchor = placeAnchorCoords(location);

  const destPlaceLines = [
    `${RIDESHARE_DESTINATION_PLACE_PREFIX}${input.placeId}`,
    `${RIDESHARE_PENDING_DESTINATION_PLACE_PREFIX}${input.placeId}`,
  ];

  const assembled = await listPublishedReachableRidesByPlaceFromMongo(input.placeId, destPlaceLines);
  const dtos = assembled.map((event) => buildActivityDto(event));

  const ranked = dtos
    .map((activity) => ({
      activity,
      distanceKmFromPlace:
        anchor != null ? rideDestinationDistanceKm(anchor, activity) : null,
    }))
    .sort((a, b) => {
      const ad = a.distanceKmFromPlace ?? Number.POSITIVE_INFINITY;
      const bd = b.distanceKmFromPlace ?? Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
      return String(a.activity.date ?? '').localeCompare(String(b.activity.date ?? ''));
    });

  const total = ranked.length;
  const start = (page - 1) * pageSize;
  const slice: PlaceReachableRideRowDTO[] = ranked.slice(start, start + pageSize);

  return {
    data: slice,
    meta: {
      page,
      pageSize,
      total,
      hasMore: start + pageSize < total,
    },
  };
};
