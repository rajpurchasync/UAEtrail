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

import { formatEventLocal } from './datetime.js';

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

type ParticipantWithUser = {
  userId: string;
  user: { email: string; profile?: { displayName?: string | null; avatarUrl?: string | null } | null };
};

export const toParticipantPreviews = (participants: ParticipantWithUser[]) =>
  participants.map((p) => ({
    id: p.userId,
    name: p.user.profile?.displayName ?? p.user.email.split('@')[0],
    avatar: p.user.profile?.avatarUrl ?? null
  }));

type EventWithRelations = Event & {
  location: Location;
  tenant: { slug: string; name: string; countryCode?: string };
  guide?: { profile?: { displayName?: string | null; avatarUrl?: string | null } | null } | null;
  participants?: Array<{ id: string } | ParticipantWithUser>;
};

export const buildEventDto = (event: EventWithRelations): EventDTO => {
  const participantsWithUser = (event.participants ?? []).filter(
    (p): p is ParticipantWithUser => 'user' in p && Boolean(p.user)
  );
  return toEventDto({
    event,
    locationName: event.location.name,
    activityType: event.location.activityType,
    slotsAvailable: Math.max(
      event.capacity - (event.participants?.length ?? 0),
      0
    ),
    organizerName: event.guide?.profile?.displayName ?? event.tenant.name,
    organizerAvatar: event.guide?.profile?.avatarUrl,
    tenantSlug: event.tenant.slug,
    participantPreviews: participantsWithUser.length > 0 ? toParticipantPreviews(participantsWithUser) : undefined,
    countryCode: event.location.countryCode ?? event.tenant.countryCode ?? 'AE'
  });
};

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
  highlights: location.highlights,
  surfaceType: location.surfaceType,
  tags: location.tags,
  parkingLink: location.parkingLink ?? undefined,
  accessibleBy: location.accessibleBy,
  viewCount: location.viewCount,
  countryCode: location.countryCode
});

export const toEventDto = ({
  event,
  locationName,
  activityType,
  slotsAvailable,
  organizerName,
  organizerAvatar,
  tenantSlug,
  participantPreviews,
  countryCode = 'AE'
}: {
  event: Event;
  locationName: string;
  activityType: ActivityType;
  slotsAvailable: number;
  organizerName: string;
  organizerAvatar?: string | null;
  tenantSlug: string;
  participantPreviews?: Array<{ id: string; name: string; avatar?: string | null }>;
  countryCode?: string;
}): EventDTO => {
  const local = formatEventLocal(event.startAt, countryCode);
  return {
  id: event.id,
  tenantId: event.tenantId,
  tenantSlug,
  locationId: event.locationId,
  locationName,
  activityType: mapActivity(activityType),
  title: event.title,
  description: event.description,
  date: local.date,
  time: local.time,
  price: event.priceAed,
  slotsTotal: event.capacity,
  slotsAvailable,
  status: mapEventStatus(event.status),
  meetingPoint: event.meetingPoint,
  itinerary: event.itinerary,
  requirements: event.requirements,
  images: event.images ?? [],
  organizerName,
  organizerAvatar,
  featured: event.featured,
  participantPreviews,
  countryCode
};
};
