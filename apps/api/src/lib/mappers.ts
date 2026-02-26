import {
  ActivityType,
  Event,
  EventStatus,
  Location,
  LocationStatus,
  MembershipRole,
  RequestStatus,
  TenantType,
  UserRole
} from '@prisma/client';
import { EventDTO, LocationDTO, MembershipRole as SharedMembershipRole, RequestStatus as SharedRequestStatus, TenantType as SharedTenantType, UserRole as SharedUserRole } from '@uaetrail/shared-types';

const enumMap = <T extends string>(value: string): T => value.toLowerCase() as T;

export const toSharedRole = (role: UserRole): SharedUserRole => enumMap<SharedUserRole>(role);
export const toSharedMembershipRole = (role: MembershipRole): SharedMembershipRole =>
  enumMap<SharedMembershipRole>(role);
export const toSharedTenantType = (type: TenantType): SharedTenantType => enumMap<SharedTenantType>(type);
export const toSharedRequestStatus = (status: RequestStatus): SharedRequestStatus =>
  enumMap<SharedRequestStatus>(status);

const mapActivity = (activityType: ActivityType): 'hiking' | 'camping' =>
  enumMap<'hiking' | 'camping'>(activityType);

const mapLocationStatus = (status: LocationStatus): 'draft' | 'active' | 'inactive' =>
  enumMap<'draft' | 'active' | 'inactive'>(status);

const mapEventStatus = (status: EventStatus): 'draft' | 'published' | 'cancelled' | 'suspended' =>
  enumMap<'draft' | 'published' | 'cancelled' | 'suspended'>(status);

export const toLocationDto = (location: Location): LocationDTO => ({
  id: location.id,
  name: location.name,
  region: location.region,
  activityType: mapActivity(location.activityType),
  description: location.description,
  difficulty: location.difficulty ? enumMap<'easy' | 'moderate' | 'hard'>(location.difficulty) : undefined,
  season: location.season,
  childFriendly: location.childFriendly,
  maxGroupSize: location.maxGroupSize ?? undefined,
  accessibility: location.accessibility
    ? enumMap<'car-accessible' | 'remote'>(location.accessibility).replace('_', '-') as 'car-accessible' | 'remote'
    : undefined,
  images: location.images,
  featured: location.featured,
  status: mapLocationStatus(location.status),
  distance: location.distance ?? undefined,
  duration: location.duration ?? undefined,
  elevation: location.elevation ?? undefined,
  campingType: (location.campingType as 'self-guided' | 'operator-led') ?? undefined,
  latitude: location.latitude,
  longitude: location.longitude,
  highlights: location.highlights
});

export const toEventDto = ({
  event,
  locationName,
  activityType,
  slotsAvailable,
  organizerName,
  organizerAvatar
}: {
  event: Event;
  locationName: string;
  activityType: ActivityType;
  slotsAvailable: number;
  organizerName: string;
  organizerAvatar?: string | null;
}): EventDTO => ({
  id: event.id,
  tenantId: event.tenantId,
  locationId: event.locationId,
  locationName,
  activityType: mapActivity(activityType),
  date: event.startAt.toISOString().slice(0, 10),
  time: event.startAt.toISOString().slice(11, 16),
  price: event.priceAed,
  slotsTotal: event.capacity,
  slotsAvailable,
  status: mapEventStatus(event.status),
  meetingPoint: event.meetingPoint,
  itinerary: event.itinerary,
  requirements: event.requirements,
  organizerName,
  organizerAvatar
});
