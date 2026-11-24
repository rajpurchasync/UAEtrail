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
  HOST_FALLBACK_DISPLAY_NAME,
  acceptedActivityGuides,
  type ActivityGuidePublicDTO,
  type PublishingProfileKind,
  type RideshareVehiclePublicDTO,
  TenantBusinessMode,
  TenantType,
  UserRole as SharedUserRole
} from '@uaetrail/shared-types';

import { formatActivityLocal } from './datetime.js';
import { resolveActivityDtoType } from '../domain/activity-type.js';
import { sanitizeRideshareVehiclePublic } from './rideshare-vehicle-crew.js';
import type { MongoActivityPrivateDoc } from './activity-private-store.js';

const enumMap = <T extends string>(value: string | null | undefined): T =>
  (typeof value === 'string' ? value.toLowerCase() : '') as T;

export const toSharedRole = (role: UserRole): SharedUserRole => enumMap<SharedUserRole>(role);

export const mapTenantType = (type: string): TenantType => enumMap<TenantType>(type);

export const mapTenantBusinessMode = (mode: string | null | undefined): TenantBusinessMode | null =>
  mode ? enumMap<TenantBusinessMode>(mode) : null;

type ActivityCapacitySource = Activity & {
  participantSlotsUsed?: number;
  participants?: Array<unknown>;
  schemaVersion?: number;
  counts?: { going?: number; waitlisted?: number; pending?: number } | null;
};

/** Headcount reserved against capacity — prefer `participantSlotsUsed`, heal stale v2 `counts`. */
export const resolveActivityParticipantSlotsUsed = (event: ActivityCapacitySource): number => {
  const fromParticipants = event.participants?.length ?? 0;
  const fromCounts =
    event.schemaVersion === 2 && event.counts != null && typeof event.counts.going === 'number'
      ? event.counts.going
      : 0;
  if (typeof event.participantSlotsUsed === 'number') {
    return Math.max(event.participantSlotsUsed, fromCounts, fromParticipants);
  }
  return Math.max(fromCounts, fromParticipants);
};

export const resolveActivitySlotsAvailable = (event: ActivityCapacitySource): number =>
  Math.max(event.capacity - resolveActivityParticipantSlotsUsed(event), 0);

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
    logoUrl?: string | null;
  };
  guide?: { profile?: { displayName?: string | null; avatarUrl?: string | null; bio?: string | null } | null } | null;
  createdBy?: { profile?: { displayName?: string | null } | null } | null;
  tenantOwner?: { profile?: { displayName?: string | null } | null } | null;
  participants?: Array<{ id: string } | ParticipantWithUser>;
};

export type ActivityDtoBuildOpts = {
  /** Merge exact meeting pin + notes from `activity_private` (crew / host / trusted tools). */
  activityPrivate?: MongoActivityPrivateDoc | null;
};

const exactMeetingFromPrivate = (
  privateDoc: MongoActivityPrivateDoc | null | undefined
): { lat: number; lng: number; meetingNotes: string | null } | null => {
  if (!privateDoc?.exactGeo?.coordinates) return null;
  const [lng, lat] = privateDoc.exactGeo.coordinates;
  if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }
  return {
    lat,
    lng,
    meetingNotes: privateDoc.meetingNotes?.trim() ? privateDoc.meetingNotes.trim() : null,
  };
};

/**
 * Applies exact meeting fields from `activity_private` onto a mapped DTO and recomputes display coords.
 */
export const mergeActivityPrivateIntoActivityDto = (
  dto: ActivityDTO,
  privateDoc: MongoActivityPrivateDoc | null | undefined
): ActivityDTO => {
  if (!privateDoc) return dto;

  const emergency = privateDoc.emergencyContact?.name?.trim() && privateDoc.emergencyContact?.phone?.trim()
    ? {
        name: privateDoc.emergencyContact.name.trim(),
        phone: privateDoc.emergencyContact.phone.trim(),
      }
    : null;
  const plateNumber =
    typeof privateDoc.plateNumber === 'string' && privateDoc.plateNumber.trim()
      ? privateDoc.plateNumber.trim()
      : null;
  const hasPrivateDetails = emergency != null || plateNumber != null;
  const activityPrivateDetails = hasPrivateDetails
    ? { emergencyContact: emergency, plateNumber: plateNumber ?? null }
    : undefined;

  const exact = exactMeetingFromPrivate(privateDoc);
  if (!exact) {
    if (!hasPrivateDetails) return dto;
    return {
      ...dto,
      ...(activityPrivateDetails ? { activityPrivateDetails } : {}),
    };
  }

  const meetingPoint = exact.meetingNotes ?? dto.meetingPoint ?? null;
  const displayCoords = resolveActivityDisplayCoordinates({
    meetingLat: exact.lat,
    meetingLng: exact.lng,
    startLat: dto.startLat ?? null,
    startLng: dto.startLng ?? null,
    parkingLat: dto.parkingLat ?? null,
    parkingLng: dto.parkingLng ?? null,
    locationLatitude: dto.locationLatitude ?? null,
    locationLongitude: dto.locationLongitude ?? null,
  });
  return {
    ...dto,
    meetingPoint,
    meetingLat: exact.lat,
    meetingLng: exact.lng,
    displayLatitude: displayCoords.latitude,
    displayLongitude: displayCoords.longitude,
    ...(activityPrivateDetails ? { activityPrivateDetails } : {}),
  };
};

export const buildActivityDto = (event: ActivityWithRelations, opts?: ActivityDtoBuildOpts): ActivityDTO => {
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
    }) ?? HOST_FALLBACK_DISPLAY_NAME;
  const hostAvatar = event.guide?.profile?.avatarUrl ?? null;
  const publicGuides: ActivityGuidePublicDTO[] = acceptedActivityGuides(event.guides).map((guide) => ({
    userId: guide.userId,
    displayName: guide.displayName,
    avatarUrl: guide.avatarUrl,
  }));
  const guides =
    publicGuides.length > 0
      ? publicGuides
      : hostUserId
        ? [{ userId: hostUserId, displayName: hostName, avatarUrl: hostAvatar }]
        : [];
  const dto = toEventDto({
    event,
    locationName: event.location.name,
    activityType: resolveActivityDtoType(event, event.location),
    region: event.location.region,
    groupRegionLevels: event.groupRegionLevels ?? event.location.groupRegionLevels ?? null,
    slotsAvailable: resolveActivitySlotsAvailable(event),
    hostName,
    hostUserId,
    hostAvatar,
    hostBio: event.guide?.profile?.bio ?? null,
    tenantName,
    tenantLogoUrl: event.tenant.logoUrl ?? null,
    publishingProfileKind,
    guides,
    hostId: event.hostId ?? undefined,
    createdById: event.createdById,
    createdByName: createdByName ?? undefined,
    tenantSlug: event.tenant.slug,
    participantPreviews: participantsWithUser.length > 0 ? toParticipantPreviews(participantsWithUser) : undefined,
    countryCode: event.location.countryCode ?? event.tenant.countryCode ?? 'AE',
    locationLatitude: event.location.latitude ?? null,
    locationLongitude: event.location.longitude ?? null,
    locationAreaId: event.location.areaId ?? null,
    locationGeoRef: event.geoRef ?? event.location.geoRef ?? null,
  });

  const priceBreakdown = event.priceBreakdown ? { ...event.priceBreakdown } : undefined;

  const built: ActivityDTO = {
    ...dto,
    schemaVersion: event.schemaVersion ?? 1,
    summary: event.summary ?? null,
    itinerarySteps: event.itinerarySteps ?? null,
    gear: event.gear ?? null,
    waitlist: event.waitlist ?? false,
    counts: event.counts ?? null,
    priceBreakdown: priceBreakdown ?? null,
    policyKey: event.policyKey ?? null,
    customPolicy: event.customPolicy ?? null,
    audience: event.audience ?? null,
    waiverRequired: event.waiverRequired ?? false,
  };

  return opts?.activityPrivate ? mergeActivityPrivateIntoActivityDto(built, opts.activityPrivate) : built;
};

export const toLocationDto = (location: Location, opts?: { admin?: boolean }): LocationDTO => ({
  id: location.id,
  name: location.name,
  region: location.region,
  areaLabel: location.areaLabel ?? null,
  destinationId: location.destinationId ?? null,
  parentPlaceId: location.parentPlaceId ?? null,
  geoRef: location.geoRef ?? null,
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
  groupRegionLevels: location.groupRegionLevels ?? undefined,
  premiumImages: location.premiumImages?.length ? location.premiumImages : undefined,
  accessibleBy: location.accessibleBy,
  viewCount: location.viewCount,
  countryCode: location.countryCode,
  registeredByUserId: location.registeredByUserId ?? location.submittedById ?? null,
  hasRouteMap: Boolean(location.gpxKey),
  hasGuide: Boolean(location.guideMarkdown || location.guidePdfKey),
  guidePreview: location.guidePreview ?? undefined,
  unlockPriceAed: location.unlockPriceAed,
  ...(opts?.admin
    ? {
        submittedById: location.submittedById,
        gpxKey: location.gpxKey,
        guidePdfKey: location.guidePdfKey,
        guideMarkdown: location.guideMarkdown
      }
    : {})
});

const mapRideshareVehiclePublic = (
  vehicle: Activity['rideshareVehicle']
): RideshareVehiclePublicDTO | null => sanitizeRideshareVehiclePublic(vehicle);

const toEventDto = ({
  event,
  locationName,
  activityType,
  region,
  groupRegionLevels,
  slotsAvailable,
  hostName,
  hostUserId,
  hostAvatar,
  hostBio,
  tenantName,
  tenantLogoUrl,
  publishingProfileKind,
  guides,
  hostId,
  createdById,
  createdByName,
  tenantSlug,
  participantPreviews,
  countryCode = 'AE',
  locationLatitude,
  locationLongitude,
  locationAreaId,
  locationGeoRef,
}: {
  event: Activity;
  locationName: string;
  activityType: ActivityType | string;
  region?: string;
  groupRegionLevels?: import('@uaetrail/shared-types').GroupRegionLevels | null;
  slotsAvailable: number;
  hostName: string;
  hostUserId: string;
  hostAvatar?: string | null;
  hostBio?: string | null;
  tenantName: string;
  tenantLogoUrl?: string | null;
  publishingProfileKind: PublishingProfileKind;
  guides?: ActivityGuidePublicDTO[];
  hostId?: string;
  createdById?: string;
  createdByName?: string;
  tenantSlug: string;
  participantPreviews?: Array<{ id: string; name: string; avatar?: string | null }>;
  countryCode?: string;
  locationLatitude?: number | null;
  locationLongitude?: number | null;
  locationAreaId?: string | null;
  locationGeoRef?: import('@uaetrail/shared-types').GeoRef | null;
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
  groupRegionLevels: groupRegionLevels ?? null,
  destinationId: locationAreaId?.trim()
    ? locationAreaId.trim()
    : event.destinationId?.trim()
      ? event.destinationId.trim()
      : null,
  geoRef: locationGeoRef ?? event.geoRef ?? null,
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
  rideshareVehicleId: event.rideshareVehicleId ?? null,
  rideshareVehicle: mapRideshareVehiclePublic(event.rideshareVehicle),
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
  tenantLogoUrl: tenantLogoUrl ?? null,
  publishingProfileKind,
  guides,
  acceptedGuideCount: guides?.length ?? (hostUserId ? 1 : 0),
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
  activityMode: event.activityMode === 'seeking' ? null : event.activityMode ?? null,
  groupChatPostPolicy: event.groupChatPostPolicy ?? null,
  discoverCommunityId: event.discoverCommunityId ?? null,
};
};
