import type { Event, Location } from '../domain/types.js';
import {
  ActivityType,
  EventStatus,
  LocationStatus,
  MembershipRole,
  RequestStatus,
  TenantType,
  UserRole
} from '../domain/enums.js';
import { EventDTO, LocationDTO, MembershipRole as SharedMembershipRole, RequestStatus as SharedRequestStatus, TenantType as SharedTenantType, UserRole as SharedUserRole } from '@uaetrail/shared-types';

import { formatEventLocal } from './datetime.js';
import { parseStoredPricePackages } from './trip-pricing.js';

const enumMap = <T extends string>(value: string | null | undefined): T => 
  (value ? value.toLowerCase() : (value as any)) as T;

export const toSharedRole = (role: UserRole): SharedUserRole => enumMap<SharedUserRole>(role);
export const toSharedMembershipRole = (role: MembershipRole): SharedMembershipRole =>
  enumMap<SharedMembershipRole>(role);
export const toSharedTenantType = (type: TenantType): SharedTenantType => enumMap<SharedTenantType>(type);
export const toSharedRequestStatus = (status: RequestStatus): SharedRequestStatus =>
  enumMap<SharedRequestStatus>(status);

const mapActivity = (activityType: ActivityType): 'hiking' | 'camping' | 'community_event' =>
  enumMap<'hiking' | 'camping' | 'community_event'>(activityType);

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
  tenant: { slug: string; name: string; countryCode?: string; ownerId: string };
  guide?: { profile?: { displayName?: string | null; avatarUrl?: string | null; bio?: string | null } | null } | null;
  participants?: Array<{ id: string } | ParticipantWithUser>;
};

export const buildEventDto = (event: EventWithRelations): EventDTO => {
  const participantsWithUser = (event.participants ?? []).filter(
    (p): p is ParticipantWithUser => 'user' in p && Boolean(p.user)
  );
  const hostUserId = event.guideId ?? event.tenant.ownerId;
  const hostName = event.guide?.profile?.displayName ?? 'Host';
  const hostAvatar = event.guide?.profile?.avatarUrl ?? null;
  const tenantName = event.tenant.name;
  return toEventDto({
    event,
    locationName: event.location.name,
    activityType: event.location.activityType,
    slotsAvailable: Math.max(
      event.capacity - (event.participants?.length ?? 0),
      0
    ),
    hostName,
    hostUserId,
    hostAvatar,
    hostBio: event.guide?.profile?.bio ?? null,
    tenantName,
    guideId: event.guideId ?? undefined,
    tenantSlug: event.tenant.slug,
    participantPreviews: participantsWithUser.length > 0 ? toParticipantPreviews(participantsWithUser) : undefined,
    countryCode: event.location.countryCode ?? event.tenant.countryCode ?? 'AE'
  });
};

export const toLocationDto = (location: Location, opts?: { admin?: boolean }): LocationDTO => ({
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
  parkingLat: location.parkingLat ?? undefined,
  parkingLng: location.parkingLng ?? undefined,
  emirate: location.emirate ?? undefined,
  premiumImages: location.premiumImages?.length ? location.premiumImages : undefined,
  accessibleBy: location.accessibleBy,
  viewCount: location.viewCount,
  countryCode: location.countryCode,
  submittedById: location.submittedById,
  hasRouteMap: Boolean(location.gpxKey),
  hasGuide: Boolean(location.guideMarkdown || location.guidePdfKey),
  guidePreview: location.guidePreview ?? undefined,
  unlockPriceAed: location.unlockPriceAed,
  ...(opts?.admin
    ? {
        gpxKey: location.gpxKey,
        guidePdfKey: location.guidePdfKey,
        guideMarkdown: location.guideMarkdown
      }
    : {})
});

export const toEventDto = ({
  event,
  locationName,
  activityType,
  slotsAvailable,
  hostName,
  hostUserId,
  hostAvatar,
  hostBio,
  tenantName,
  guideId,
  tenantSlug,
  participantPreviews,
  countryCode = 'AE'
}: {
  event: Event;
  locationName: string;
  activityType: ActivityType;
  slotsAvailable: number;
  hostName: string;
  hostUserId: string;
  hostAvatar?: string | null;
  hostBio?: string | null;
  tenantName: string;
  guideId?: string;
  tenantSlug: string;
  participantPreviews?: Array<{ id: string; name: string; avatar?: string | null }>;
  countryCode?: string;
}): EventDTO => {
  const local = formatEventLocal(event.startAt, countryCode);
  const endLocal = event.endAt ? formatEventLocal(event.endAt, countryCode) : null;
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
  endDate: endLocal?.date ?? null,
  endTime: endLocal?.time ?? null,
  price: event.priceAed,
  pricePackages: parseStoredPricePackages(event.pricePackages),
  slotsTotal: event.capacity,
  slotsAvailable,
  status: mapEventStatus(event.status),
  meetingPoint: event.meetingPoint,
  meetingLat: event.meetingLat,
  meetingLng: event.meetingLng,
  parkingPoint: event.parkingPoint,
  parkingLat: event.parkingLat,
  parkingLng: event.parkingLng,
  meetingDifferent: event.meetingDifferent,
  carPoolEnabled: event.carPoolEnabled,
  carPoolFree: event.carPoolFree,
  carPoolPriceAed: event.carPoolPriceAed,
  carPoolDetails: event.carPoolDetails,
  paymentTerms: event.paymentTerms,
  itinerary: event.itinerary,
  requirements: event.requirements,
  images: event.images ?? [],
  hostName,
  hostUserId,
  hostAvatar: hostAvatar ?? undefined,
  hostBio: hostBio ?? undefined,
  tenantName,
  guideId: guideId ?? null,
  organizerName: hostName,
  organizerAvatar: hostAvatar ?? undefined,
  organizerUserId: hostUserId,
  featured: event.featured,
  participantPreviews,
  countryCode
};
};