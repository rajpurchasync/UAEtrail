import { randomUUID } from 'crypto';
import type { DetailRevampConfidence, MemberVehicleColor } from '@uaetrail/shared-types';
import {
  defaultPolicyKeyForMode,
  mapLegacyPricingToBreakdown,
  migrateInstructionAndPlanLinesToGear,
  migrateLegacyItineraryStringsToSteps,
} from '@uaetrail/shared-types';
import type { Location } from '../domain/types.js';
import {
  ActivityType,
  Difficulty,
  ActivityStatus,
  LocationStatus,
  type Accessibility
} from '../domain/enums.js';

const asStringArray = (value: unknown): string[] => (Array.isArray(value) ? value : []);

export type RelationConnect = { connect?: { id?: string }; disconnect?: true };

export type LocationCreateInput = {
  name: string;
  region?: string;
  areaLabel?: string | null;
  areaId?: string | null;
  /** Leaf row → place hub (`locations` id). */
  parentPlaceId?: string | null;
  activityType: ActivityType | string;
  description?: string;
  difficulty?: Difficulty | string | null;
  season?: string[];
  childFriendly?: boolean;
  maxGroupSize?: number | null;
  accessibility?: Accessibility | string | null;
  images?: string[];
  featured?: boolean;
  status?: LocationStatus | string;
  distance?: number | null;
  duration?: number | null;
  elevation?: number | null;
  campingType?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  highlights?: string[];
  surfaceType?: string[];
  tags?: string[];
  parkingLink?: string | null;
  parkingLat?: number | null;
  parkingLng?: number | null;
  groupRegionLevels?: import('@uaetrail/shared-types').GroupRegionLevels | null;
  premiumImages?: string[];
  accessibleBy?: string[];
  countryCode?: string;
  gpxKey?: string | null;
  guidePdfKey?: string | null;
  guideMarkdown?: string | null;
  guidePreview?: string | null;
  unlockPriceAed?: number;
  submittedBy?: RelationConnect;
  registryListed?: boolean;
  externalSource?: 'catalog' | 'osm' | null;
  externalId?: string | null;
};

export type ActivityCreateInput = {
  tenant?: RelationConnect;
  location?: RelationConnect;
  createdBy?: RelationConnect;
  host?: RelationConnect;
  guide?: RelationConnect;
  activityType?: ActivityType | string;
  title: string;
  description?: string;
  startAt: Date;
  endAt?: Date | null;
  meetingPoint?: string | null;
  meetingLat?: number | null;
  meetingLng?: number | null;
  startPoint?: string | null;
  startLat?: number | null;
  startLng?: number | null;
  parkingPoint?: string | null;
  parkingLat?: number | null;
  parkingLng?: number | null;
  originLat?: number | null;
  originLng?: number | null;
  originLabel?: string | null;
  meetingDifferent?: boolean;
  rideshareEnabled?: boolean;
  rideshareFree?: boolean | null;
  ridesharePriceAed?: number | null;
  rideshareSeats?: number | null;
  rideshareDetails?: string | null;
  rideshareVehicleId?: string | null;
  rideshareVehicle?: {
    id: string;
    make: string;
    model: string;
    color: MemberVehicleColor;
    year: number;
  } | null;
  linkedActivityId?: string | null;
  linkedRideshareActivityId?: string | null;
  paymentTerms?: string | null;
  pricingMode?: 'free' | 'shared' | 'paid' | null;
  itinerary?: string[];
  requirements?: string[];
  joinMode?: 'open' | 'private' | null;
  participationMode?: 'rsvp' | 'approval' | null;
  images?: string[];
  bannerUrl?: string | null;
  signupUrl?: string | null;
  priceAed?: number;
  pricePackages?: unknown;
  capacity: number;
  waitlist?: boolean;
  status?: ActivityStatus | string;
  featured?: boolean;
  publishedAt?: Date | null;
  outingCategory?: string | null;
  outingTopic?: string | null;
  activityMode?: 'hosted' | 'seeking' | null;
  participantIntentId?: string | null;
  groupChatPostPolicy?: 'all_participants' | 'host_only' | null;
  areaId?: string | null;
  groupRegionLevels?: import('@uaetrail/shared-types').GroupRegionLevels | null;
};

export type ActivityUpdateInput = {
  activityType?: ActivityType | string;
  title?: string;
  description?: string;
  startAt?: Date;
  endAt?: Date | null;
  meetingPoint?: string | null;
  meetingLat?: number | null;
  meetingLng?: number | null;
  startPoint?: string | null;
  startLat?: number | null;
  startLng?: number | null;
  parkingPoint?: string | null;
  parkingLat?: number | null;
  parkingLng?: number | null;
  originLat?: number | null;
  originLng?: number | null;
  originLabel?: string | null;
  meetingDifferent?: boolean;
  rideshareEnabled?: boolean;
  rideshareFree?: boolean | null;
  ridesharePriceAed?: number | null;
  rideshareSeats?: number | null;
  rideshareDetails?: string | null;
  rideshareVehicleId?: string | null;
  rideshareVehicle?: {
    id: string;
    make: string;
    model: string;
    color: MemberVehicleColor;
    year: number;
  } | null;
  linkedActivityId?: string | null;
  linkedRideshareActivityId?: string | null;
  paymentTerms?: string | null;
  pricingMode?: 'free' | 'shared' | 'paid' | null;
  itinerary?: string[];
  requirements?: string[];
  joinMode?: 'open' | 'private' | null;
  participationMode?: 'rsvp' | 'approval' | null;
  images?: string[];
  bannerUrl?: string | null;
  signupUrl?: string | null;
  priceAed?: number;
  pricePackages?: unknown;
  capacity?: number;
  waitlist?: boolean;
  status?: ActivityStatus | string;
  featured?: boolean;
  publishedAt?: Date | null;
  host?: RelationConnect;
  location?: RelationConnect;
  outingCategory?: string | null;
  outingTopic?: string | null;
  activityMode?: 'hosted' | 'seeking' | null;
  participantIntentId?: string | null;
  groupChatPostPolicy?: 'all_participants' | 'host_only' | null;
  areaId?: string | null;
  groupRegionLevels?: import('@uaetrail/shared-types').GroupRegionLevels | null;
};

const extractConnectedId = (relation?: RelationConnect): string | null => {
  if (relation && typeof relation === 'object' && 'connect' in relation) {
    return relation.connect?.id ?? null;
  }
  return null;
};

export const buildLocationFromCreateInput = (data: LocationCreateInput, id: string): Location => {
  const now = new Date();
  return {
    id,
    name: data.name,
    region: data.region ?? '',
    areaLabel: data.areaLabel?.trim() ? data.areaLabel.trim() : null,
    areaId: data.areaId?.trim() ? data.areaId.trim() : null,
    parentPlaceId: data.parentPlaceId?.trim() ? data.parentPlaceId.trim() : null,
    activityType: data.activityType as Location['activityType'],
    description: data.description ?? '',
    difficulty: (data.difficulty as Location['difficulty']) ?? null,
    season: asStringArray(data.season),
    childFriendly: data.childFriendly ?? false,
    maxGroupSize: data.maxGroupSize ?? null,
    accessibility: (data.accessibility as Location['accessibility']) ?? null,
    images: asStringArray(data.images),
    featured: data.featured ?? false,
    status: (data.status as Location['status']) ?? LocationStatus.DRAFT,
    distance: data.distance ?? null,
    duration: data.duration ?? null,
    elevation: data.elevation ?? null,
    campingType: data.campingType ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    highlights: asStringArray(data.highlights),
    surfaceType: asStringArray(data.surfaceType),
    tags: asStringArray(data.tags),
    parkingLink: data.parkingLink ?? null,
    parkingLat: data.parkingLat ?? null,
    parkingLng: data.parkingLng ?? null,
    groupRegionLevels: data.groupRegionLevels ?? null,
    premiumImages: asStringArray(data.premiumImages),
    accessibleBy: asStringArray(data.accessibleBy),
    viewCount: 0,
    countryCode: typeof data.countryCode === 'string' ? data.countryCode : 'AE',
    gpxKey: data.gpxKey ?? null,
    guidePdfKey: data.guidePdfKey ?? null,
    guideMarkdown: data.guideMarkdown ?? null,
    guidePreview: data.guidePreview ?? null,
    unlockPriceAed: data.unlockPriceAed ?? 29,
    submittedById: extractConnectedId(data.submittedBy),
    registryListed: data.registryListed !== false,
    externalSource: data.externalSource ?? null,
    externalId: data.externalId ?? null,
    createdAt: now,
    updatedAt: now
  };
};

export type MongoActivityDoc = {
  _id: string;
  tenantId: string;
  locationId: string;
  activityType?: ActivityType | null;
  createdById: string;
  hostId: string | null;
  title: string;
  description: string;
  startAt: Date;
  endAt: Date | null;
  meetingPoint: string | null;
  meetingLat: number | null;
  meetingLng: number | null;
  startPoint: string | null;
  startLat: number | null;
  startLng: number | null;
  parkingPoint: string | null;
  parkingLat: number | null;
  parkingLng: number | null;
  originLat: number | null;
  originLng: number | null;
  originLabel: string | null;
  meetingDifferent: boolean;
  rideshareEnabled: boolean;
  rideshareFree: boolean | null;
  ridesharePriceAed: number | null;
  rideshareSeats: number | null;
  rideshareDetails: string | null;
  rideshareVehicleId: string | null;
  rideshareVehicle: {
    id: string;
    make: string;
    model: string;
    color: MemberVehicleColor;
    year: number;
  } | null;
  linkedActivityId: string | null;
  linkedRideshareActivityId: string | null;
  paymentTerms: string | null;
  pricingMode: 'free' | 'shared' | 'paid' | null;
  /** Empty on schema v2 — use itinerarySteps. */
  itinerary: string[];
  requirements: string[];
  joinMode?: 'open' | 'private' | null;
  participationMode?: 'rsvp' | 'approval' | null;
  images: string[];
  bannerUrl: string | null;
  signupUrl: string | null;
  priceAed: number;
  pricePackages: unknown;
  capacity: number;
  participantSlotsUsed?: number;
  status: ActivityStatus;
  featured: boolean;
  publishedAt: Date | null;
  outingCategory?: string | null;
  outingTopic?: string | null;
  areaId?: string | null;
  geoRef?: import('@uaetrail/shared-types').GeoRef | null;
  groupRegionLevels?: import('@uaetrail/shared-types').GroupRegionLevels | null;
  activityMode?: 'hosted' | 'seeking' | null;
  participantIntentId?: string | null;
  /** Hosted activity id when a seeking pin was fulfilled (M2d activity-primary rows). */
  seekingConvertedActivityId?: string | null;
  groupChatPostPolicy?: 'all_participants' | 'host_only' | null;
  guides?: import('../domain/types.js').ActivityGuideRecord[];
  schemaVersion?: 1 | 2;
  summary?: string | null;
  itinerarySteps?: import('@uaetrail/shared-types').ActivityItineraryStepDTO[];
  gear?: import('@uaetrail/shared-types').ActivityGearItemDTO[];
  waitlist?: boolean;
  counts?: import('@uaetrail/shared-types').ActivityCountsDTO;
  priceBreakdown?: import('@uaetrail/shared-types').ActivityPriceBreakdownDTO;
  policyKey?: import('@uaetrail/shared-types').ActivityPolicyKeyDTO;
  customPolicy?: string | null;
  audience?: import('../domain/types.js').Activity['audience'];
  waiverRequired?: boolean;
  needsReview?: string[];
  confidence?: Record<string, DetailRevampConfidence>;
  createdAt: Date;
  updatedAt: Date;
};

const requirementsSignalWomenOnly = (requirements: string[]): boolean =>
  requirements.some((line) => /\bwomen[-\s]?only\b/i.test(line.trim()));

const requirementsSignalKidsWelcome = (requirements: string[]): boolean =>
  requirements.some((line) => /\b(kids?\s+welcome|child[-\s]?friendly|families?\s+welcome)\b/i.test(line.trim()));

const requirementsSignalPets = (requirements: string[]): boolean =>
  requirements.some((line) => /\b(pets?\s+allowed|dogs?\s+allowed)\b/i.test(line.trim()));

const extractLanguageLines = (requirements: string[]): string[] => {
  const out: string[] = [];
  for (const line of requirements) {
    const m = line.trim().match(/^Languages?\s*:\s*(.+)$/i);
    if (m?.[1]) {
      out.push(
        ...m[1]
          .split(/[,;/]/)
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }
  }
  return [...new Set(out)];
};

export const buildDetailRevampSnapshotFromLegacy = (input: {
  itineraryLines: string[];
  requirements: string[];
  description: string;
  priceAed: number;
  pricingMode: 'free' | 'shared' | 'paid' | null;
}): Pick<
  MongoActivityDoc,
  | 'schemaVersion'
  | 'itinerary'
  | 'summary'
  | 'itinerarySteps'
  | 'gear'
  | 'priceBreakdown'
  | 'policyKey'
  | 'audience'
  | 'waiverRequired'
> => {
  const requirements = input.requirements;
  const itinerarySteps = migrateLegacyItineraryStringsToSteps(input.itineraryLines);
  const gear = migrateInstructionAndPlanLinesToGear(requirements);
  const priceBreakdown = mapLegacyPricingToBreakdown({
    priceAed: input.priceAed,
    pricingMode: input.pricingMode,
  });
  const policyKey = defaultPolicyKeyForMode(priceBreakdown.mode);
  const summary = input.description.trim().slice(0, 160) || null;
  return {
    schemaVersion: 2,
    itinerary: [],
    summary,
    itinerarySteps,
    gear,
    priceBreakdown,
    policyKey,
    audience: {
      kidsWelcome: requirementsSignalKidsWelcome(requirements),
      minAge: null,
      petsAllowed: requirementsSignalPets(requirements),
      womenOnly: requirementsSignalWomenOnly(requirements),
      fitness: 'unknown',
      fitnessNote: null,
      languages: extractLanguageLines(requirements),
      accessibility: null,
    },
    waiverRequired: false,
  };
};

export const buildActivityFromCreateInput = (data: ActivityCreateInput, id: string): MongoActivityDoc => {
  if (data.activityMode === 'seeking') {
    throw new Error('activity_mode_seeking_retired');
  }
  const now = new Date();
  const requirements = asStringArray(data.requirements);
  const priorItineraryLines = asStringArray(data.itinerary);
  const revamp = buildDetailRevampSnapshotFromLegacy({
    itineraryLines: priorItineraryLines,
    requirements,
    description: data.description ?? '',
    priceAed: data.priceAed ?? 0,
    pricingMode: data.pricingMode ?? null,
  });

  return {
    _id: id,
    tenantId: extractConnectedId(data.tenant)!,
    locationId: extractConnectedId(data.location)!,
    activityType: (data.activityType as ActivityType | undefined) ?? null,
    createdById: extractConnectedId(data.createdBy)!,
    hostId: extractConnectedId(data.host) ?? extractConnectedId(data.guide),
    title: data.title,
    description: data.description ?? '',
    startAt: data.startAt,
    endAt: data.endAt ?? null,
    meetingPoint: data.meetingPoint ?? null,
    meetingLat: data.meetingLat ?? null,
    meetingLng: data.meetingLng ?? null,
    startPoint: data.startPoint ?? null,
    startLat: data.startLat ?? null,
    startLng: data.startLng ?? null,
    parkingPoint: data.parkingPoint ?? null,
    parkingLat: data.parkingLat ?? null,
    parkingLng: data.parkingLng ?? null,
    originLat: data.originLat ?? null,
    originLng: data.originLng ?? null,
    originLabel: data.originLabel ?? null,
    meetingDifferent: data.meetingDifferent ?? false,
    rideshareEnabled: data.rideshareEnabled ?? false,
    rideshareFree: data.rideshareFree ?? null,
    ridesharePriceAed: data.ridesharePriceAed ?? null,
    rideshareSeats: data.rideshareSeats ?? null,
    rideshareDetails: data.rideshareDetails ?? null,
    rideshareVehicleId: data.rideshareVehicleId ?? null,
    rideshareVehicle: data.rideshareVehicle ?? null,
    linkedActivityId: data.linkedActivityId ?? null,
    linkedRideshareActivityId: data.linkedRideshareActivityId ?? null,
    paymentTerms: data.paymentTerms ?? null,
    pricingMode: data.pricingMode ?? null,
    itinerary: revamp.itinerary,
    requirements,
    joinMode: data.joinMode ?? null,
    participationMode: data.participationMode ?? null,
    images: asStringArray(data.images),
    bannerUrl: data.bannerUrl?.trim() || null,
    signupUrl: data.signupUrl?.trim() || null,
    priceAed: data.priceAed ?? 0,
    pricePackages: data.pricePackages ?? [],
    capacity: data.capacity,
    participantSlotsUsed: 0,
    status: (data.status as ActivityStatus) ?? ActivityStatus.DRAFT,
    featured: data.featured ?? false,
    publishedAt: data.publishedAt ?? null,
    outingCategory: data.outingCategory ?? null,
    outingTopic: data.outingTopic ?? null,
    areaId: data.areaId?.trim() ? data.areaId.trim() : null,
    groupRegionLevels: data.groupRegionLevels ?? null,
    activityMode: data.activityMode ?? 'hosted',
    participantIntentId: data.participantIntentId ?? null,
    groupChatPostPolicy: data.groupChatPostPolicy ?? null,
    schemaVersion: revamp.schemaVersion,
    summary: revamp.summary,
    itinerarySteps: revamp.itinerarySteps,
    gear: revamp.gear,
    waitlist: data.waitlist !== false,
    counts: { going: 0, waitlisted: 0, pending: 0 },
    priceBreakdown: revamp.priceBreakdown,
    policyKey: revamp.policyKey,
    customPolicy: null,
    audience: revamp.audience,
    waiverRequired: revamp.waiverRequired,
    needsReview: [],
    confidence: {},
    createdAt: now,
    updatedAt: now
  };
};

export const newEntityId = (): string => randomUUID();
