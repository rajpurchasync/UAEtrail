import { EventDTO, LocationDTO } from '@uaetrail/shared-types';
import { api } from './services';
import { CampingSpot, Trail, Trip } from '../types';

const mapTripStatus = (event: EventDTO): Trip['status'] => {
  if (event.slotsAvailable <= 0) return 'full';
  if (event.price > 0) return 'paid';
  return 'free';
};

const mapEventToTrip = (event: EventDTO): Trip => ({
  id: event.id,
  locationId: event.locationId,
  locationName: event.locationName,
  activityType: event.activityType,
  date: event.date,
  time: event.time,
  operatorId: event.tenantId,
  organizerName: event.organizerName,
  organizerAvatar: event.organizerAvatar ?? undefined,
  price: event.price,
  slotsAvailable: event.slotsAvailable,
  slotsTotal: event.slotsTotal,
  status: mapTripStatus(event),
  participantIds: [],
  meetingPoint: event.meetingPoint ?? undefined,
  itinerary: event.itinerary ?? undefined,
  requirements: event.requirements ?? undefined
});

const mapLocationToTrail = (location: LocationDTO): Trail => ({
  id: location.id,
  name: location.name,
  region: location.region as Trail['region'],
  difficulty: location.difficulty ?? 'moderate',
  distance: 0,
  duration: 0,
  elevation: 0,
  season: (location.season as Trail['season']) ?? ['winter'],
  childFriendly: location.childFriendly,
  description: location.description,
  images: location.images,
  featured: location.featured
});

const mapLocationToCamp = (location: LocationDTO): CampingSpot => ({
  id: location.id,
  name: location.name,
  region: location.region as CampingSpot['region'],
  campingType: 'operator-led',
  season: (location.season as CampingSpot['season']) ?? ['winter'],
  maxGroupSize: location.maxGroupSize ?? 10,
  accessibility: location.accessibility ?? 'car-accessible',
  difficulty: location.difficulty,
  description: location.description,
  images: location.images,
  featured: location.featured
});

export const featureFlags = {
  useApiHome: import.meta.env.VITE_USE_API_HOME === 'true',
  useApiDiscovery: import.meta.env.VITE_USE_API_DISCOVERY === 'true',
  useApiCalendar: import.meta.env.VITE_USE_API_CALENDAR === 'true',
  useApiTripDetail: import.meta.env.VITE_USE_API_TRIP_DETAIL === 'true'
};

export const fetchPublicMappedData = async (): Promise<{
  trails: Trail[];
  camps: CampingSpot[];
  trips: Trip[];
}> => {
  const [locationsResponse, eventsResponse] = await Promise.all([api.getPublicLocations(), api.getPublicEvents()]);
  const trails = locationsResponse.data.filter((item) => item.activityType === 'hiking').map(mapLocationToTrail);
  const camps = locationsResponse.data.filter((item) => item.activityType === 'camping').map(mapLocationToCamp);
  const trips = eventsResponse.data.map(mapEventToTrip);
  return { trails, camps, trips };
};

export const fetchApiTrips = async (): Promise<Trip[]> => {
  const events = await api.getPublicEvents();
  return events.data.map(mapEventToTrip);
};

export const fetchApiLocations = async (): Promise<{ trails: Trail[]; camps: CampingSpot[] }> => {
  const locations = await api.getPublicLocations();
  return {
    trails: locations.data.filter((item) => item.activityType === 'hiking').map(mapLocationToTrail),
    camps: locations.data.filter((item) => item.activityType === 'camping').map(mapLocationToCamp)
  };
};

export const fetchApiTripDetail = async (id: string) => {
  const response = await api.getPublicEventDetail(id);
  return response.data;
};
