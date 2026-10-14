import type { Activity, Location } from '../domain/types.js';
import { resolveJoinMode } from '../domain/activity-join-mode.js';
import { resolveParticipationMode } from '../domain/activity-participation-mode.js';
import {
  ActivityType,
  ActivityStatus,
  LocationStatus,
  UserRole
} from '../domain/enums.js';
import {
  ActivityDTO,
  LocationDTO,
  resolveActivityDisplayCoordinates,
  inferHostStorefrontKindFromTenantWire,
  resolveHostPersonDisplayName,
  ORGANIZER_FALLBACK_DISPLAY_NAME,
  type PublishingProfileKind,
  TenantBusinessMode,
  TenantType,
  UserRole as SharedUserRole
} from '@uaetrail/shared-types';

import { formatActivityLocal } from './datetime.js';
import { resolveActivityDtoType } from '../domain/activity-type.js';

const enumMap = <T extends string>(value: string | null | undefined): T =>
  (typeof value === 'string' ? value.toLowerCase() : '') as T;

export const toSharedRole = (role: UserRole): SharedUserRole => enumMap<SharedUserRole>(role);

export const mapTenantType = (type: string): TenantType => enumMap<TenantType>(type);

export const mapTenantBusinessMode = (mode: string | null | undefined): TenantBusinessMode | null =>
  mode ? enumMap<TenantBusinessMode>(mode) : null;

const resolveSlotsAvailable = (event: Activity & { participantSlotsUsed?: number; participants?: Array<unknown> }): number => {
  const used =
    typeof event.participantSlotsUsed === 'number'
      ? event.participantSlotsUsed
      : (event.participants?.length ?? 0);
  return Math.max(event.capacity - used, 0);
};

const mapPlaceActivityType = (activityType: ActivityType | string): LocationDTO['activityType'] => {
  const value = String(activityType).toUpperCase();
  if (value === 'HIKING') return 'hiking';
  if (value === 'CAMPING') return 'camping';
  if (value === 'SHOP') return 'shop';
  if (value === 'RIDESHARE' || value === 'CARPOOL') return 'rideshare';
  return 'event';
};

const mapScheduledActivityType = (activityType: ActivityType | string): ActivityDTO['activityType'] => {
  const value = String(activityType).toUpperCase();
  if (value === 'HIKING') return 'hiking';
  if (value === 'CAMPING') return 'camping';
  if (value === 'RIDESHARE' || value === 'CARPOOL') return 'rideshare';
  return 'event';
};

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
  participantSlotsUsed?: number;
  location: Location;
  tenant: {
    slug: string;
    name: string;
    countryCode?: string;
    ownerId: string;
    type?: string;
    businessMode?: string | null;
    publishingPurpose?: string | null;
  };
  guide?: { profile?: { displayName?: string | null; avatarUrl?: string | null; bio?: string | null } | null } | null;
  createdBy?: { profile?: { displayName?: string | null } | null } | null;
  tenantOwner?: { profile?: { displayName?: string | null } | null } | null;
  participants?: Array<{ id: string } | ParticipantWithUser>;
};

export const buildActivityDto = (event : ActivityWithRelations): ActivityDTO => {
  const participantsWithUser = (event.participants ?? []).filter(
    (p): p is ParticipantWithUser => 'user' in p && Boolean(p.user)
  );
  const tenantName = event.tenant.name;
  const hostUserId = event.hostId ?? event.tenant.ownerId;
  const guideName = event.guide?.profile?.displayName ?? null;
  const createdByName = event.createdBy?.profile?.displayName ?? null;
  const tenantOwnerName = event.tenantOwner?.profile?.displayName ?? null;
  const publishingProfileKind = inferHostStorefrontKindFromTenantWire({
    type: event.tenant.type,
    businessMode: event.tenant.businessMode,
    publishingPurpose: event.tenant.publishingPurpose,
  });
  const hostName =
    resolveHostPersonDisplayName({
      guideName,
      createdByName,
      tenantOwnerName,
      tenantName,
    }) ?? ORGANIZER_FALLBACK_DISPLAY_NAME;
  const hostAvatar = event.guide?.profile?.avatarUrl ?? null;
  return toEventDto({
    event,
    locationName: event.location.name,
    activityType: resolveActivityDtoType(event, event.location),
    region: event.location.region,
    slotsAvailable: resolveSlotsAvailable(event),
    hostName,
    hostUserId,
    hostAvatar,
    hostBio: event.guide?.profile?.bio ?? null,
    tenantName,
    publishingProfileKind,
    hostId: event.hostId ?? undefined,
    createdById: event.createdById,
    createdByName: createdByName ?? undefined,
    tenantSlug: event.tenant.slug,
    participantPreviews: participantsWithUser.length > 0 ? toParticipantPreviews(participantsWithUser) : undefined,
    countryCode: event.location.countryCode ?? event.tenant.countryCode ?? 'AE',
    locationLatitude: event.location.latitude ?? null,
    locationLongitude: event.location.longitude ?? null,
    locationAreaId: event.location.areaId ?? null
  });
};

export const toLocationDto = (location: Location, opts?: { admin?: boolean }): LocationDTO => ({
  id: location.id,
  name: location.name,
  region: location.region,
  areaLabel: location.areaLabel ?? null,
  areaId: location.areaId ?? null,
  activityType: mapPlaceActivityType(location.activityType),
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

const toEventDto = ({
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
  publishingProfileKind,
  hostId,
  createdById,
  createdByName,
  tenantSlug,
  participantPreviews,
  countryCode = 'AE',
  locationLatitude,
  locationLongitude,
  locationAreaId
}: {
  event : Activity;
  locationName: string;
  activityType: ActivityType | string;
  region?: string;
  slotsAvailable: number;
  hostName: string;
  hostUserId: string;
  hostAvatar?: string | null;
  hostBio?: string | null;
  tenantName: string;
  publishingProfileKind: PublishingProfileKind;
  hostId?: string;
  createdById?: string;
  createdByName?: string;
  tenantSlug: string;
  participantPreviews?: Array<{ id: string; name: string; avatar?: string | null }>;
  countryCode?: string;
  locationLatitude?: number | null;
  locationLongitude?: number | null;
  locationAreaId?: string | null;
}): ActivityDTO => {
  const local = formatActivityLocal(event.startAt, countryCode);
  const endLocal = event.endAt ? formatActivityLocal(event.endAt, countryCode) : null;
  const displayCoords = resolveActivityDisplayCoordinates({
    meetingLat: event.meetingLat,
    meetingLng: event.meetingLng,
    startLat: event.startLat,
    startLng: event.startLng,
    parkingLat: event.parkingLat,
    parkingLng: event.parkingLng,
    locationLatitude: locationLatitude ?? null,
    locationLongitude: locationLongitude ?? null,
  });
  return {
  id: event.id,
  tenantId: event.tenantId,
  tenantSlug,
  locationId: event.locationId,
  locationName,
  region,
  areaId: locationAreaId?.trim()
    ? locationAreaId.trim()
    : event.areaId?.trim()
      ? event.areaId.trim()
      : null,
  activityType: mapScheduledActivityType(activityType),
  title: event.title,
  description: event.description,
  date: local.date,
  time: local.time,
  endDate: endLocal?.date ?? null,
  endTime: endLocal?.time ?? null,
  price: event.priceAed,
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
  rideshareEnabled: event.rideshareEnabled,
  rideshareFree: event.rideshareFree,
  ridesharePriceAed: event.ridesharePriceAed,
  rideshareSeats: event.rideshareSeats ?? null,
  rideshareDetails: event.rideshareDetails,
  linkedActivityId: event.linkedActivityId ?? null,
  linkedRideshareActivityId: event.linkedRideshareActivityId ?? null,
  paymentTerms: event.paymentTerms,
  pricingMode: event.pricingMode ?? null,
  itinerary: event.itinerary,
  requirements: event.requirements,
  joinMode: resolveJoinMode(event.joinMode, event.requirements),
  participationMode: resolveParticipationMode(event.participationMode, event.requirements),
  images: event.images ?? [],
  bannerUrl: event.bannerUrl ?? null,
  hostName,
  hostUserId,
  hostAvatar: hostAvatar ?? undefined,
  hostBio: hostBio ?? undefined,
  tenantName,
  publishingProfileKind,
  hostId: hostId ?? null,
  createdById,
  createdByName,
  featured: event.featured,
  participantPreviews,
  countryCode,
  locationLatitude: locationLatitude ?? null,
  locationLongitude: locationLongitude ?? null,
  displayLatitude: displayCoords.latitude,
  displayLongitude: displayCoords.longitude,
  outingCategory: event.outingCategory ?? null,
  outingTopic: event.outingTopic ?? null,
  activityMode: event.activityMode ?? null,
  participantIntentId: event.participantIntentId ?? null,
  groupChatPostPolicy: event.groupChatPostPolicy ?? null
};
};
