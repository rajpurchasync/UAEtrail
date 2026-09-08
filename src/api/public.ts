import { ActivityDTO, LocationDTO, LocationPremiumSummaryDTO } from '@uaetrail/shared-types';
import { api } from './services';
import { CampingSpot, Trail, ActivityListing, CommunityActivitySpot } from '../types';
import { tripHasPaidPricing } from '../utils/tripPricing';

const mapListingStatus = (event: ActivityDTO): ActivityListing['status'] => {
  if (event.slotsAvailable <= 0) return 'full';
  if (tripHasPaidPricing(event)) return 'paid';
  return 'free';
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
  hostName: event.hostName ?? event.organizerName,
  hostUserId: event.hostUserId ?? event.organizerUserId,
  hostAvatar: event.hostAvatar ?? event.organizerAvatar ?? undefined,
  images: event.images,
  price: event.price,
  pricePackages: event.pricePackages,
  pricingMode: event.pricingMode ?? undefined,
  slotsAvailable: event.slotsAvailable,
  slotsTotal: event.slotsTotal,
  status: mapListingStatus(event),
  participantIds: event.participantPreviews?.map((p) => p.id) ?? [],
  participantPreviews: event.participantPreviews,
  meetingPoint: event.meetingPoint ?? undefined,
  itinerary: event.itinerary ?? undefined,
  requirements: event.requirements ?? undefined,
  latitude: event.meetingLat ?? event.startLat ?? event.locationLatitude ?? null,
  longitude: event.meetingLng ?? event.startLng ?? event.locationLongitude ?? null
});

const mapLocationFields = (location: LocationDTO) => ({
  parkingLink: location.parkingLink,
  highlights: location.highlights,
  surfaceType: location.surfaceType,
  tags: location.tags,
  accessibleBy: location.accessibleBy,
});

const mapLocationToTrail = (location: LocationDTO): Trail => ({
  id: location.id,
  name: location.name,
  region: location.region as Trail['region'],
  difficulty: location.difficulty ?? 'moderate',
  distance: location.distance ?? 0,
  duration: location.duration ?? 0,
  elevation: location.elevation ?? 0,
  season: (location.season as Trail['season']) ?? ['winter'],
  childFriendly: location.childFriendly,
  description: location.description,
  images: location.images,
  featured: location.featured,
  latitude: location.latitude,
  longitude: location.longitude,
  ...mapLocationFields(location),
});

const mapLocationToCamp = (location: LocationDTO): CampingSpot => ({
  id: location.id,
  name: location.name,
  region: location.region as CampingSpot['region'],
  campingType: (location.campingType as CampingSpot['campingType']) ?? 'operator-led',
  season: (location.season as CampingSpot['season']) ?? ['winter'],
  maxGroupSize: location.maxGroupSize ?? 10,
  accessibility: location.accessibility ?? 'car-accessible',
  difficulty: location.difficulty,
  description: location.description,
  images: location.images,
  featured: location.featured,
  latitude: location.latitude,
  longitude: location.longitude,
  ...mapLocationFields(location),
});

const mapLocationTocommunityActivity = (location: LocationDTO): CommunityActivitySpot => ({
  id: location.id,
  name: location.name,
  region: location.region as CommunityActivitySpot['region'],
  difficulty: location.difficulty ?? 'moderate',
  distance: location.distance,
  duration: location.duration,
  season: (location.season as CommunityActivitySpot['season']) ?? ['winter'],
  description: location.description,
  images: location.images,
  featured: location.featured,
  latitude: location.latitude,
  longitude: location.longitude,
  ...mapLocationFields(location),
});

/** Fast home payload: 3 parallel requests, no location pagination loop. */
export const fetchHomeLandingData = async (): Promise<{
  popularTrails: Trail[];
  popularCamps: CampingSpot[];
  featuredActivities: ActivityListing[];
  allActivities: ActivityListing[];
}> => {
  const [popularRes, featuredRes, eventsRes] = await Promise.all([
    api.getPopularLocations(6),
    api.getFeaturedActivities(6),
    api.getPublicActivities()
  ]);

  return {
    popularTrails: popularRes.data.filter((l) => l.activityType === 'hiking').map(mapLocationToTrail),
    popularCamps: popularRes.data.filter((l) => l.activityType === 'camping').map(mapLocationToCamp),
    featuredActivities: featuredRes.data.map(mapActivityToListing),
    allActivities: eventsRes.data.map(mapActivityToListing)
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
    communityActivities: res.data.filter((item) => item.activityType === 'event').map(mapLocationTocommunityActivity),
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
    .map(mapLocationTocommunityActivity);
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
      .map(mapLocationTocommunityActivity),
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
  return { communityActivity: mapLocationTocommunityActivity(loc), premium: response.premium };
};
