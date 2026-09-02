import { ActivityDTO, LocationDTO, LocationPremiumSummaryDTO } from '@uaetrail/shared-types';
import { api } from './services';
import { CampingSpot, Trail, Trip, CommunityActivitySpot } from '../types';
import { tripHasPaidPricing } from '../utils/tripPricing';

const mapTripStatus = (event: ActivityDTO): Trip['status'] => {
  if (event.slotsAvailable <= 0) return 'full';
  if (tripHasPaidPricing(event)) return 'paid';
  return 'free';
};

export const mapActivityToTrip = (event: ActivityDTO): Trip => ({
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
  organizerName: event.hostName ?? event.organizerName,
  organizerAvatar: event.hostAvatar ?? event.organizerAvatar ?? undefined,
  organizerUserId: event.hostUserId ?? event.organizerUserId,
  images: event.images,
  price: event.price,
  pricePackages: event.pricePackages,
  pricingMode: event.pricingMode ?? undefined,
  slotsAvailable: event.slotsAvailable,
  slotsTotal: event.slotsTotal,
  status: mapTripStatus(event),
  participantIds: event.participantPreviews?.map((p) => p.id) ?? [],
  participantPreviews: event.participantPreviews,
  meetingPoint: event.meetingPoint ?? undefined,
  itinerary: event.itinerary ?? undefined,
  requirements: event.requirements ?? undefined
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

export const fetchPopularLocations = async (): Promise<{
  trails: Trail[];
  camps: CampingSpot[];
  communityActivities: CommunityActivitySpot[];
}> => {
  const res = await api.getPopularLocations(6);
  return {
    trails: res.data.filter((l) => l.activityType === 'hiking').map(mapLocationToTrail),
    camps: res.data.filter((l) => l.activityType === 'camping').map(mapLocationToCamp),
    communityActivities: res.data.filter((l) => l.activityType === 'community_activity').map(mapLocationTocommunityActivity),
  };
};

export const fetchFeaturedEvents = async (): Promise<Trip[]> => {
  const res = await api.getFeaturedActivities(6);
  return res.data.map(mapActivityToTrip);
};

/** Fast home payload: 3 parallel requests, no location pagination loop. */
export const fetchHomeLandingData = async (): Promise<{
  popularTrails: Trail[];
  popularCamps: CampingSpot[];
  featuredTrips: Trip[];
  allTrips: Trip[];
}> => {
  const [popularRes, featuredRes, eventsRes] = await Promise.all([
    api.getPopularLocations(6),
    api.getFeaturedActivities(6),
    api.getPublicActivities()
  ]);

  return {
    popularTrails: popularRes.data.filter((l) => l.activityType === 'hiking').map(mapLocationToTrail),
    popularCamps: popularRes.data.filter((l) => l.activityType === 'camping').map(mapLocationToCamp),
    featuredTrips: featuredRes.data.map(mapActivityToTrip),
    allTrips: eventsRes.data.map(mapActivityToTrip)
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
    communityActivities: res.data.filter((item) => item.activityType === 'community_activity').map(mapLocationTocommunityActivity),
  };
};

export const fetchPublicMappedData = async (): Promise<{
  trails: Trail[];
  camps: CampingSpot[];
  communityActivities: CommunityActivitySpot[];
  trips: Trip[];
}> => {
  const [locationsResponse, eventsResponse] = await Promise.all([api.getPublicLocations(), api.getPublicActivities()]);
  const trails = locationsResponse.data.filter((item) => item.activityType === 'hiking').map(mapLocationToTrail);
  const camps = locationsResponse.data.filter((item) => item.activityType === 'camping').map(mapLocationToCamp);
  const communityActivities = locationsResponse.data
    .filter((item) => item.activityType === 'community_activity')
    .map(mapLocationTocommunityActivity);
  const trips = eventsResponse.data.map(mapActivityToTrip);
  return { trails, camps, communityActivities, trips };
};

export const fetchApiTrips = async (when: 'upcoming' | 'past' = 'upcoming'): Promise<Trip[]> => {
  const events = await api.getPublicActivities({ when, pageSize: 100 });
  return events.data.map(mapActivityToTrip);
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
      .filter((item) => item.activityType === 'community_activity')
      .map(mapLocationTocommunityActivity),
  };
};

export const fetchApiTripDetail = async (id: string) => {
  const response = await api.getPublicActivityDetail(id);
  return response.data;
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
