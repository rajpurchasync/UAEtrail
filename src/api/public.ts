import type { ActivityDTO, LocationDTO, LocationPremiumSummaryDTO } from '@uaetrail/shared-types';
import { api } from './services';
import { ActivityListing } from '../types';
import type { Place } from '../types/place';
import { mapLocationToPlace } from './mappers/place';
import { activityHasPaidPricing } from '../utils/activityPricing';

export { mapLocationToPlace } from './mappers/place';

const mapListingStatus = (event: ActivityDTO): ActivityListing['status'] => {
  if (event.slotsAvailable <= 0) return 'full';
  if (activityHasPaidPricing(event)) return 'paid';
  return 'free';
};

const normalizeStringArray = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return undefined;
};

const normalizeImages = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return undefined;
};

export const mapActivityToListing = (event: ActivityDTO): ActivityListing => ({
  id: event.id,
  locationId: event.locationId,
  locationName: event.locationName,
  region: event.region,
  activityType: event.activityType,
  title: event.title,
  description: event.description,
  date: event.date,
  time: event.time,
  operatorId: event.tenantId,
  tenantSlug: event.tenantSlug,
  tenantName: event.tenantName,
  hostName: event.hostName,
  hostUserId: event.hostUserId,
  hostAvatar: event.hostAvatar ?? undefined,
  images: normalizeImages(event.images),
  price: event.price,
  pricePackages: event.pricePackages,
  pricingMode: event.pricingMode ?? undefined,
  slotsAvailable: event.slotsAvailable,
  slotsTotal: event.slotsTotal,
  status: mapListingStatus(event),
  participantIds: event.participantPreviews?.map((p) => p.id) ?? [],
  participantPreviews: event.participantPreviews,
  meetingPoint: event.meetingPoint ?? undefined,
  itinerary: normalizeStringArray(event.itinerary),
  requirements: normalizeStringArray(event.requirements),
  latitude: event.displayLatitude ?? event.meetingLat ?? event.startLat ?? event.locationLatitude ?? null,
  longitude: event.displayLongitude ?? event.meetingLng ?? event.startLng ?? event.locationLongitude ?? null,
});

/** Max cards shown per home carousel section (Featured Activities, Trails, Camping). */
export const HOME_LANDING_SECTION_LIMIT = 3;

const isVenueActivityType = (activityType: LocationDTO['activityType']) =>
  activityType === 'hiking' || activityType === 'camping' || activityType === 'event';

const mapLocationsToPlaces = (locations: LocationDTO[]): Place[] =>
  locations.filter((item) => isVenueActivityType(item.activityType)).map(mapLocationToPlace);

/** Fast home payload: 3 parallel requests, no location pagination loop. */
export const fetchHomeLandingData = async (): Promise<{
  popularPlaces: Place[];
  featuredActivities: ActivityListing[];
  allActivities: ActivityListing[];
}> => {
  const limit = HOME_LANDING_SECTION_LIMIT;
  const [popularResult, featuredResult, eventsResult] = await Promise.allSettled([
    api.getPopularPlaces(limit),
    api.getFeaturedActivities(limit),
    api.getPublicActivities({ when: 'upcoming', pageSize: 100 }),
  ]);

  const popularRes = popularResult.status === 'fulfilled' ? popularResult.value : { data: [] as LocationDTO[] };
  const featuredRes = featuredResult.status === 'fulfilled' ? featuredResult.value : { data: [] as ActivityDTO[] };
  const eventsRes = eventsResult.status === 'fulfilled' ? eventsResult.value : { data: [] as ActivityDTO[] };
  const places = mapLocationsToPlaces(popularRes.data);

  return {
    popularPlaces: [
      ...places.filter((place) => place.activityType === 'hiking').slice(0, limit),
      ...places.filter((place) => place.activityType === 'camping').slice(0, limit),
    ],
    featuredActivities: featuredRes.data.map(mapActivityToListing).slice(0, limit),
    allActivities: eventsRes.data.map(mapActivityToListing),
  };
};

/** Background load for Explore UAE region counts — one page only. */
export const fetchHomeRegionPlaces = async (): Promise<{ places: Place[] }> => {
  const res = await api.getPlacesPage(1, 100);
  return { places: mapLocationsToPlaces(res.data) };
};

export const fetchPublicPlaces = async (countryCode?: string): Promise<Place[]> => {
  const response = await api.getPublicPlaces(countryCode);
  return mapLocationsToPlaces(response.data);
};

export const fetchPublicExploreCatalog = async (): Promise<{
  places: Place[];
  activities: ActivityListing[];
}> => {
  const [places, activities] = await Promise.all([fetchPublicPlaces(), fetchApiActivities()]);
  return { places, activities };
};

export const fetchApiActivities = async (when: 'upcoming' | 'past' = 'upcoming'): Promise<ActivityListing[]> => {
  const events = await api.getPublicActivities({ when, pageSize: 100 });
  return events.data.map(mapActivityToListing);
};

/** Canonical place detail fetch. */
export const fetchPlaceDetail = async (
  id: string
): Promise<{ place: Place | null; premium: LocationPremiumSummaryDTO | null }> => {
  const response = await api.getPublicPlaceDetail(id);
  const activityType = response.data.activityType;
  if (!isVenueActivityType(activityType)) {
    return { place: null, premium: response.premium ?? null };
  }
  return { place: mapLocationToPlace(response.data), premium: response.premium ?? null };
};
