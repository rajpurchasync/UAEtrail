import { randomUUID } from 'crypto';
import type { Activity, Location } from '../domain/types.js';
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
  emirate?: string | null;
  premiumImages?: string[];
  accessibleBy?: string[];
  countryCode?: string;
  gpxKey?: string | null;
  guidePdfKey?: string | null;
  guideMarkdown?: string | null;
  guidePreview?: string | null;
  unlockPriceAed?: number;
  submittedBy?: RelationConnect;
};

export type ActivityCreateInput = {
  tenant?: RelationConnect;
  location?: RelationConnect;
  createdBy?: RelationConnect;
  host?: RelationConnect;
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
  meetingDifferent?: boolean;
  carPoolEnabled?: boolean;
  carPoolFree?: boolean | null;
  carPoolPriceAed?: number | null;
  carPoolSeats?: number | null;
  carPoolDetails?: string | null;
  paymentTerms?: string | null;
  pricingMode?: 'free' | 'shared' | 'paid' | null;
  itinerary?: string[];
  requirements?: string[];
  images?: string[];
  bannerUrl?: string | null;
  signupUrl?: string | null;
  priceAed?: number;
  pricePackages?: unknown;
  capacity: number;
  status?: ActivityStatus | string;
  featured?: boolean;
  publishedAt?: Date | null;
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
  meetingDifferent?: boolean;
  carPoolEnabled?: boolean;
  carPoolFree?: boolean | null;
  carPoolPriceAed?: number | null;
  carPoolSeats?: number | null;
  carPoolDetails?: string | null;
  paymentTerms?: string | null;
  pricingMode?: 'free' | 'shared' | 'paid' | null;
  itinerary?: string[];
  requirements?: string[];
  images?: string[];
  bannerUrl?: string | null;
  signupUrl?: string | null;
  priceAed?: number;
  pricePackages?: unknown;
  capacity?: number;
  status?: ActivityStatus | string;
  featured?: boolean;
  publishedAt?: Date | null;
  host?: RelationConnect;
  location?: RelationConnect;
};

export const extractConnectedId = (relation?: RelationConnect): string | null => {
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
    emirate: data.emirate ?? null,
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
  meetingDifferent: boolean;
  carPoolEnabled: boolean;
  carPoolFree: boolean | null;
  carPoolPriceAed: number | null;
  carPoolSeats: number | null;
  carPoolDetails: string | null;
  paymentTerms: string | null;
  pricingMode: 'free' | 'shared' | 'paid' | null;
  itinerary: string[];
  requirements: string[];
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
  createdAt: Date;
  updatedAt: Date;
};

export const activityRowToMongoDoc = (event : Activity): MongoActivityDoc => ({
  _id: event.id,
  tenantId: event.tenantId,
  locationId: event.locationId,
  activityType: event.activityType ?? null,
  createdById: event.createdById,
  hostId: event.hostId,
  title: event.title,
  description: event.description,
  startAt: event.startAt,
  endAt: event.endAt,
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
  images: event.images,
  bannerUrl: event.bannerUrl ?? null,
  signupUrl: event.signupUrl ?? null,
  priceAed: event.priceAed,
  pricePackages: event.pricePackages,
  capacity: event.capacity,
  status: event.status,
  featured: event.featured,
  publishedAt: event.publishedAt,
  createdAt: event.createdAt,
  updatedAt: event.updatedAt
});

export const buildActivityFromCreateInput = (data: ActivityCreateInput, id: string): MongoActivityDoc => {
  const now = new Date();
  return {
    _id: id,
    tenantId: extractConnectedId(data.tenant)!,
    locationId: extractConnectedId(data.location)!,
    activityType: (data.activityType as ActivityType | undefined) ?? null,
    createdById: extractConnectedId(data.createdBy)!,
    hostId: extractConnectedId(data.host),
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
    meetingDifferent: data.meetingDifferent ?? false,
    carPoolEnabled: data.carPoolEnabled ?? false,
    carPoolFree: data.carPoolFree ?? null,
    carPoolPriceAed: data.carPoolPriceAed ?? null,
    carPoolSeats: data.carPoolSeats ?? null,
    carPoolDetails: data.carPoolDetails ?? null,
    paymentTerms: data.paymentTerms ?? null,
    pricingMode: data.pricingMode ?? null,
    itinerary: asStringArray(data.itinerary),
    requirements: asStringArray(data.requirements),
    images: asStringArray(data.images),
    bannerUrl: data.bannerUrl?.trim() || null,
    signupUrl: data.signupUrl?.trim() || null,
    priceAed: data.priceAed ?? 0,
    pricePackages: data.pricePackages ?? [],
    capacity: data.capacity,
    status: (data.status as ActivityStatus) ?? ActivityStatus.DRAFT,
    featured: data.featured ?? false,
    publishedAt: data.publishedAt ?? null,
    createdAt: now,
    updatedAt: now
  };
};

export const newEntityId = (): string => randomUUID();
