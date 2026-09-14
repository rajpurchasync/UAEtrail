import { ActivityDTO, LocationDTO, LocationPremiumSummaryDTO } from '@uaetrail/shared-types';
import { api } from './services';
import { CampingSpot, Trail, ActivityListing, CommunityActivitySpot } from '../types';
import { activityHasPaidPricing } from '../utils/activityPricing';

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
  longitude: event.displayLongitude ?? event.meetingLng ?? event.startLng ?? event.locationLongitude ?? null
});

const mapLocationFields = (location: LocationDTO) => ({
  parkingLat: location.parkingLat,
  parkingLng: location.parkingLng,
  parkingLink: location.parkingLink,
  highlights: location.highlights,
  surfaceType: location.surfaceType,
  tags: location.tags,
  accessibleBy: location.accessibleBy,
});

export const mapLocationToTrail = (location: LocationDTO): Trail => ({
  id: location.id,
  name: location.name,
  region: location.region as Trail['region'],
  difficulty: location.difficulty ?? undefined,
  distance: location.distance ?? undefined,
  duration: location.duration ?? undefined,
  elevation: location.elevation ?? undefined,
  season: location.season?.length ? (location.season as Trail['season']) : undefined,
  childFriendly: location.childFriendly,
  description: location.description,
  images: location.images,
  featured: location.featured,
  latitude: location.latitude,
  longitude: location.longitude,
  ...mapLocationFields(location),
});

export const mapLocationToCamp = (location: LocationDTO): CampingSpot => ({
  id: location.id,
  name: location.name,
  region: location.region as CampingSpot['region'],
  campingType: location.campingType as CampingSpot['campingType'] | undefined,
  season: location.season?.length ? (location.season as CampingSpot['season']) : undefined,
  maxGroupSize: location.maxGroupSize ?? undefined,
  accessibility: location.accessibility ?? undefined,
  difficulty: location.difficulty,
  description: location.description,
  images: location.images,
  featured: location.featured,
  latitude: location.latitude,
  longitude: location.longitude,
  ...mapLocationFields(location),
});

export const mapLocationToCommunityActivity = (location: LocationDTO): CommunityActivitySpot => ({
  id: location.id,
  name: location.name,
  region: location.region as CommunityActivitySpot['region'],
  difficulty: location.difficulty ?? undefined,
  distance: location.distance ?? undefined,
  duration: location.duration ?? undefined,
  season: location.season?.length ? (location.season as CommunityActivitySpot['season']) : undefined,
  description: location.description,
  images: location.images,
  featured: location.featured,
  latitude: location.latitude,
  longitude: location.longitude,
  ...mapLocationFields(location),
});

/** Max cards shown per home carousel section (Featured Activities, Trails, Camping). */
export const HOME_LANDING_SECTION_LIMIT = 3;

/** Fast home payload: 3 parallel requests, no location pagination loop. */
export const fetchHomeLandingData = async (): Promise<{
  popularTrails: Trail[];
  popularCamps: CampingSpot[];
  featuredActivities: ActivityListing[];
  allActivities: ActivityListing[];
}> => {
  const limit = HOME_LANDING_SECTION_LIMIT;
  const [popularResult, featuredResult, eventsResult] = await Promise.allSettled([
    api.getPopularLocations(limit),
    api.getFeaturedActivities(limit),
    api.getPublicActivities({ when: 'upcoming', pageSize: 100 }),
  ]);

  const popularRes = popularResult.status === 'fulfilled' ? popularResult.value : { data: [] as LocationDTO[] };
  const featuredRes = featuredResult.status === 'fulfilled' ? featuredResult.value : { data: [] as ActivityDTO[] };
  const eventsRes = eventsResult.status === 'fulfilled' ? eventsResult.value : { data: [] as ActivityDTO[] };

  return {
    popularTrails: popularRes.data.filter((l) => l.activityType === 'hiking').map(mapLocationToTrail).slice(0, limit),
    popularCamps: popularRes.data.filter((l) => l.activityType === 'camping').map(mapLocationToCamp).slice(0, limit),
    featuredActivities: featuredRes.data.map(mapActivityToListing).slice(0, limit),
    allActivities: eventsRes.data.map(mapActivityToListing),
  };
};

/** Background load for Explore UAE region counts — one page only. */
export const fetchHomeRegionLocations = async (): Promise<{
  trails: Trail[];
  camps: CampingSpot[];
  communityActivities: CommunityActivitySpot[];
}> => {
  const res = await api.getLocationsPage(1, 100);
  return {
    trails: res.data.filter((item) => item.activityType === 'hiking').map(mapLocationToTrail),
    camps: res.data.filter((item) => item.activityType === 'camping').map(mapLocationToCamp),
    communityActivities: res.data.filter((item) => item.activityType === 'event').map(mapLocationToCommunityActivity),
  };
};

export const fetchPublicMappedData = async (): Promise<{
  trails: Trail[];
  camps: CampingSpot[];
  communityActivities: CommunityActivitySpot[];
  activities: ActivityListing[];
}> => {
  const [locationsResponse, eventsResponse] = await Promise.all([api.getPublicLocations(), api.getPublicActivities()]);
  const trails = locationsResponse.data.filter((item) => item.activityType === 'hiking').map(mapLocationToTrail);
  const camps = locationsResponse.data.filter((item) => item.activityType === 'camping').map(mapLocationToCamp);
  const communityActivities = locationsResponse.data
    .filter((item) => item.activityType === 'event')
    .map(mapLocationToCommunityActivity);
  const activities = eventsResponse.data.map(mapActivityToListing);
  return { trails, camps, communityActivities, activities };
};

export const fetchApiActivities = async (when: 'upcoming' | 'past' = 'upcoming'): Promise<ActivityListing[]> => {
  const events = await api.getPublicActivities({ when, pageSize: 100 });
  return events.data.map(mapActivityToListing);
};

export const fetchApiLocations = async (countryCode?: string): Promise<{
  trails: Trail[];
  camps: CampingSpot[];
  communityActivities: CommunityActivitySpot[];
}> => {
  const locations = await api.getPublicLocations(countryCode);
  return {
    trails: locations.data.filter((item) => item.activityType === 'hiking').map(mapLocationToTrail),
    camps: locations.data.filter((item) => item.activityType === 'camping').map(mapLocationToCamp),
    communityActivities: locations.data
      .filter((item) => item.activityType === 'event')
      .map(mapLocationToCommunityActivity),
  };
};

export const fetchApiLocationDetail = async (
  id: string
): Promise<{
  trail?: Trail;
  camp?: CampingSpot;
  communityActivity?: CommunityActivitySpot;
  premium: LocationPremiumSummaryDTO | null;
}> => {
  const response = await api.getPublicLocationDetail(id);
  const loc = response.data;
  if (loc.activityType === 'hiking') {
    return { trail: mapLocationToTrail(loc), premium: response.premium };
  }
  if (loc.activityType === 'camping') {
    return { camp: mapLocationToCamp(loc), premium: response.premium };
  }
  return { communityActivity: mapLocationToCommunityActivity(loc), premium: response.premium };
};
