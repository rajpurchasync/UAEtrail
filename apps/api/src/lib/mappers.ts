import type { Activity, Location } from '../domain/types.js';
import {
  ActivityType,
  ActivityStatus,
  LocationStatus,
  MembershipRole,
  RequestStatus,
  TenantType,
  UserRole
} from '../domain/enums.js';
import { ActivityDTO, LocationDTO, MembershipRole as SharedMembershipRole, RequestStatus as SharedRequestStatus, TenantType as SharedTenantType, UserRole as SharedUserRole } from '@uaetrail/shared-types';

import { formatActivityLocal } from './datetime.js';
import { parseStoredPricePackages } from './trip-pricing.js';

const enumMap = <T extends string>(value: string | null | undefined): T =>
  (typeof value === 'string' ? value.toLowerCase() : '') as T;

export const toSharedRole = (role: UserRole): SharedUserRole => enumMap<SharedUserRole>(role);
export const toSharedMembershipRole = (role: MembershipRole): SharedMembershipRole =>
  enumMap<SharedMembershipRole>(role);
export const toSharedTenantType = (type: TenantType): SharedTenantType => enumMap<SharedTenantType>(type);
export const toSharedRequestStatus = (status: RequestStatus): SharedRequestStatus =>
  enumMap<SharedRequestStatus>(status);

const mapActivity = (activityType: ActivityType): 'hiking' | 'camping' | 'community_activity' =>
  enumMap<'hiking' | 'camping' | 'community_activity'>(activityType);

const mapLocationStatus = (status: LocationStatus): 'draft' | 'active' | 'inactive' =>
  enumMap<'draft' | 'active' | 'inactive'>(status);

const mapActivityStatus = (status: ActivityStatus): 'draft' | 'published' | 'cancelled' | 'suspended' =>
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

type ActivityWithRelations = Activity & {
  location: Location;
  tenant: { slug: string; name: string; countryCode?: string; ownerId: string };
  guide?: { profile?: { displayName?: string | null; avatarUrl?: string | null; bio?: string | null } | null } | null;
  createdBy?: { profile?: { displayName?: string | null } | null } | null;
  participants?: Array<{ id: string } | ParticipantWithUser>;
};

export const buildActivityDto = (event : ActivityWithRelations): ActivityDTO => {
  const participantsWithUser = (event.participants ?? []).filter(
    (p): p is ParticipantWithUser => 'user' in p && Boolean(p.user)
  );
  const hostUserId = event.hostId ?? event.tenant.ownerId;
  const hostName = event.guide?.profile?.displayName ?? 'Host';
  const hostAvatar = event.guide?.profile?.avatarUrl ?? null;
  const tenantName = event.tenant.name;
  const createdByName = event.createdBy?.profile?.displayName ?? undefined;
  return toEventDto({
    event,
    locationName: event.location.name,
    activityType: event.location.activityType,
    region: event.location.region,
    slotsAvailable: Math.max(
      event.capacity - (event.participants?.length ?? 0),
      0
    ),
    hostName,
    hostUserId,
    hostAvatar,
    hostBio: event.guide?.profile?.bio ?? null,
    tenantName,
    hostId: event.hostId ?? undefined,
    createdById: event.createdById,
    createdByName,
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
  region,
  slotsAvailable,
  hostName,
  hostUserId,
  hostAvatar,
  hostBio,
  tenantName,
  hostId,
  createdById,
  createdByName,
  tenantSlug,
  participantPreviews,
  countryCode = 'AE'
}: {
  event : Activity;
  locationName: string;
  activityType: ActivityType;
  region?: string;
  slotsAvailable: number;
  hostName: string;
  hostUserId: string;
  hostAvatar?: string | null;
  hostBio?: string | null;
  tenantName: string;
  hostId?: string;
  createdById?: string;
  createdByName?: string;
  tenantSlug: string;
  participantPreviews?: Array<{ id: string; name: string; avatar?: string | null }>;
  countryCode?: string;
}): ActivityDTO => {
  const local = formatActivityLocal(event.startAt, countryCode);
  const endLocal = event.endAt ? formatActivityLocal(event.endAt, countryCode) : null;
  return {
  id: event.id,
  tenantId: event.tenantId,
  tenantSlug,
  locationId: event.locationId,
  locationName,
  region,
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
  status: mapActivityStatus(event.status),
  meetingPoint: event.meetingPoint,
  meetingLat: event.meetingLat,
  meetingLng: event.meetingLng,
  startPoint: event.startPoint,
  startLat: event.startLat,
  startLng: event.startLng,
  parkingPoint: event.parkingPoint,
  parkingLat: event.parkingLat,
  parkingLng: event.parkingLng,
  meetingDifferent: event.meetingDifferent,
  carPoolEnabled: event.carPoolEnabled,
  carPoolFree: event.carPoolFree,
  carPoolPriceAed: event.carPoolPriceAed,
  carPoolSeats: event.carPoolSeats ?? null,
  carPoolDetails: event.carPoolDetails,
  paymentTerms: event.paymentTerms,
  pricingMode: event.pricingMode ?? null,
  itinerary: event.itinerary,
  requirements: event.requirements,
  images: event.images ?? [],
  hostName,
  hostUserId,
  hostAvatar: hostAvatar ?? undefined,
  hostBio: hostBio ?? undefined,
  tenantName,
  hostId: hostId ?? null,
  createdById,
  createdByName,
  organizerName: hostName,
  organizerAvatar: hostAvatar ?? undefined,
  organizerUserId: hostUserId,
  featured: event.featured,
  participantPreviews,
  countryCode
};
};
