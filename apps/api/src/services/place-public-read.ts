import { UserRole } from '../domain/enums.js';
import type { LocationListFilters } from '../lib/location-query.js';
import { ApiError } from '../lib/api-error.js';
import {
  findActiveLocationById,
  findLocationForDetailView,
  incrementActiveLocationViewCount,
  listPopularActiveLocations,
  listPublishedUpcomingActivitiesByLocation,
} from '../lib/activities-store.js';
import { loadExploreMapForRequest } from '../lib/explore-map-route.js';
import { listActiveLocations } from '../lib/location-query.js';
import { buildActivityDto, toLocationDto } from '../lib/mappers.js';
import { listNearbyFacilitiesForPlace } from '../lib/place-nearby-facilities.js';
import {
  assertRegistryCoverForPublicPlaceDetail,
  enrichLocationDtoWithAreaHub,
} from '../lib/place-detail-enrichment.js';
import { buildPlaceCatalog } from './place-catalog.js';
import { buildPlaceRegistry, type PlaceRegistryQuery } from './place-registry.js';
import { buildPlaceViewerAccess, type PlaceViewerAccessSource } from './place-viewer-access.js';
import {
  buildPremiumSummary,
  checkPremiumAccess,
  locationHasPremiumContent,
  assertPremiumAccess,
  readStoredFile,
} from './location-premium.js';
import { loadExploreSeekingActivitiesForViewer } from './explore-seeking-activities-read.js';
import type { PlaceCatalogQuery } from '@uaetrail/shared-types';

export const loadExploreMapForViewer = (input: {
  query: {
    bbox?: string;
    cursor?: string;
    limit?: string;
    area?: string;
    projection?: string;
    sources?: string;
    includeRideshare?: string;
  };
  viewerUserId: string | null;
  userRole?: string | null;
}) =>
  loadExploreMapForRequest({
    query: input.query,
    viewerUserId: input.viewerUserId,
    userRole: input.userRole ?? null,
  });

export const loadExploreSeekingActivitiesForMapViewer = () =>
  loadExploreSeekingActivitiesForViewer({
    viewerUserId: null,
    userRole: null,
  });

export const listPublicPlacesPaged = async (filters: LocationListFilters) => {
  const { items, total } = await listActiveLocations({
    activityType: filters.activityType,
    featured: filters.featured,
    countryCode: filters.countryCode,
    lat: filters.lat,
    lng: filters.lng,
    radius: filters.radius,
    page: filters.page,
    pageSize: filters.pageSize,
  });
  return { items: items.map((l) => toLocationDto(l)), total };
};

export const loadPublicPlaceRegistry = (input: PlaceRegistryQuery) => buildPlaceRegistry(input);

export const loadPublicPlaceCatalog = (input: PlaceCatalogQuery & {
  userId: string | null;
  platformAdmin: boolean;
}) =>
  buildPlaceCatalog({
    ...input,
    userId: input.userId,
    platformAdmin: input.platformAdmin,
  });

export const listPopularPublicPlaces = async (limit: number) => {
  const locations = await listPopularActiveLocations(limit);
  return locations.map((l) => toLocationDto(l));
};

export const listPublicPlaceUpcomingActivities = async (placeId: string) => {
  const events = await listPublishedUpcomingActivitiesByLocation(placeId, 20);
  return events.map((event) => buildActivityDto(event));
};

export const loadPublicPlaceDetailPayload = async (input: {
  placeId: string;
  viewerUserId: string | null;
  viewerRole?: string | null;
}) => {
  const location = await findLocationForDetailView(
    input.placeId,
    input.viewerUserId,
    input.viewerRole ?? null
  );
  if (!location) {
    throw new ApiError(404, 'location_not_found', 'Location not found.');
  }

  assertRegistryCoverForPublicPlaceDetail(location);

  const access = await checkPremiumAccess(
    input.viewerUserId,
    input.placeId,
    (input.viewerRole ?? undefined) as UserRole | undefined
  );
  const premium = locationHasPremiumContent(location) ? buildPremiumSummary(location, access) : null;
  const nearbyFacilities = await listNearbyFacilitiesForPlace(location);
  const data = await enrichLocationDtoWithAreaHub(location, toLocationDto(location));
  const viewerAccess = buildPlaceViewerAccess({
    viewerUserId: input.viewerUserId,
    viewerRole: input.viewerRole ?? null,
    place: location as PlaceViewerAccessSource,
  });

  return { data, premium, nearbyFacilities, viewerAccess };
};

export const loadPublicPlacePremiumGuideContent = async (input: {
  placeId: string;
  userId: string;
  userRole: UserRole;
}) => {
  const location = await findActiveLocationById(input.placeId);
  if (!location) {
    throw new ApiError(404, 'location_not_found', 'Location not found.');
  }
  if (!location.guideMarkdown && !location.guidePdfKey) {
    throw new ApiError(404, 'guide_not_available', 'No guide content for this location.');
  }
  await assertPremiumAccess(input.userId, input.placeId, input.userRole);
  return {
    locationId: input.placeId,
    locationName: location.name,
    markdown: location.guideMarkdown ?? null,
    hasPdf: Boolean(location.guidePdfKey),
  };
};

export const readPublicPlacePremiumMapFile = async (input: {
  placeId: string;
  userId: string;
  userRole: UserRole;
}) => {
  const location = await findActiveLocationById(input.placeId);
  if (!location) {
    throw new ApiError(404, 'location_not_found', 'Location not found.');
  }
  if (!location.gpxKey) {
    throw new ApiError(404, 'map_not_available', 'No route map file for this location.');
  }
  await assertPremiumAccess(input.userId, input.placeId, input.userRole);
  return readStoredFile(location.gpxKey);
};

export const readPublicPlacePremiumGuidePdfFile = async (input: {
  placeId: string;
  userId: string;
  userRole: UserRole;
}) => {
  const location = await findActiveLocationById(input.placeId);
  if (!location?.guidePdfKey) {
    throw new ApiError(404, 'guide_pdf_not_available', 'No PDF guide for this location.');
  }
  await assertPremiumAccess(input.userId, input.placeId, input.userRole);
  return readStoredFile(location.guidePdfKey);
};

export const recordPublicPlaceView = (placeId: string) => incrementActiveLocationViewCount(placeId);
