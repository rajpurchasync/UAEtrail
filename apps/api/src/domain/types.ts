/**
 * Entity types mirroring Prisma models (scalar fields only).
 * Use instead of `@prisma/client` model types in store layers.
 */

import type { OutingCategory, OutingTopic } from '@uaetrail/shared-types';
import type {
  Accessibility,
  ActivityType,
  Difficulty,
  ActivityStatus,
  LocationStatus,
  MembershipRole,
  RequestStatus,
  TenantStatus,
  TenantBusinessMode,
  TenantType,
} from './enums.js';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  businessMode?: TenantBusinessMode | null;
  status: TenantStatus;
  ownerId: string;
  countryCode: string;
  description?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  services?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  region?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantMembership {
  id: string;
  tenantId: string;
  userId: string;
  role: MembershipRole;
  createdAt: Date;
}

export interface Location {
  id: string;
  name: string;
  region: string;
  /** Trailhead / wadi / beach zone for explore list subtitle and poster location chip. */
  areaLabel: string | null;
  /** Curated geographic area (`areas` collection). */
  areaId?: string | null;
  activityType: ActivityType;
  description: string;
  difficulty: Difficulty | null;
  season: string[];
  childFriendly: boolean;
  maxGroupSize: number | null;
  accessibility: Accessibility | null;
  images: string[];
  featured: boolean;
  status: LocationStatus;
  distance: number | null;
  duration: number | null;
  elevation: number | null;
  campingType: string | null;
  latitude: number | null;
  longitude: number | null;
  highlights: string[];
  surfaceType: string[];
  tags: string[];
  parkingLink: string | null;
  parkingLat: number | null;
  parkingLng: number | null;
  groupRegionLevels: import('@uaetrail/shared-types').GroupRegionLevels | null;
  premiumImages: string[];
  accessibleBy: string[];
  viewCount: number;
  countryCode: string;
  gpxKey: string | null;
  guidePdfKey: string | null;
  guideMarkdown: string | null;
  guidePreview: string | null;
  unlockPriceAed: number;
  submittedById: string | null;
  /** Canonical member submitter (CPC); dual-read with {@link submittedById} on legacy rows. */
  registeredByUserId?: string | null;
  /** When false, place exists for activity linkage only — not in public venue catalog. */
  registryListed?: boolean;
  /** Provenance for imported venue catalogs (`catalog`) or legacy OSM rows. */
  externalSource?: 'catalog' | 'osm' | null;
  /** Provider-stable id, e.g. `node/12345`. */
  externalId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  tenantId: string;
  locationId: string;
  /** When set, overrides location.activityType for scheduled listing kind. */
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
    color: string;
    year: number;
  } | null;
  /** Parent hike/camp/event when this is a linked rideshare listing. */
  linkedActivityId: string | null;
  /** Linked rideshare activity id when a ride offer is enabled for this listing. */
  linkedRideshareActivityId: string | null;
  paymentTerms: string | null;
  pricingMode: 'free' | 'shared' | 'paid' | null;
  itinerary: string[];
  requirements: string[];
  joinMode?: 'open' | 'private' | null;
  participationMode?: 'rsvp' | 'approval' | null;
  groupChatPostPolicy?: 'all_participants' | 'host_only' | null;
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
  groupRegionLevels?: import('@uaetrail/shared-types').GroupRegionLevels | null;
  outingCategory?: OutingCategory | null;
  outingTopic?: OutingTopic | null;
  /** Curated area slug target — set on publish from place or point-in-polygon. */
  areaId?: string | null;
  activityMode?: 'hosted' | 'seeking' | null;
  participantIntentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityRequest {
  id: string;
  activityId: string;
  userId: string;
  status: RequestStatus;
  note: string | null;
  selectedPackageIndex: number | null;
  hostNote: string | null;
  cancelReason: string | null;
  cancelMessage: string | null;
  cancelledAt: Date | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityParticipant {
  id: string;
  activityId: string;
  userId: string;
  requestId: string;
  approvedById: string;
  checkedInAt: Date | null;
  hostRatingScore: number | null;
  hostRatingComment: string | null;
  hostRatedAt: Date | null;
  hostRatingRideshare?: {
    cleanliness: number;
    punctuality: number;
    behaviour: number;
    payment?: number | null;
  } | null;
  createdAt: Date;
}

export interface MediaAsset {
  id: string;
  key: string;
  url: string;
  bucket: string;
  mimeType: string;
  size: number;
  uploadedById: string;
  tenantId: string | null;
  kind: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  activityId: string | null;
  content: string;
  replyToMessageId: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface MerchantProfile {
  id: string;
  adminIds: string[];
  /** Linked shop tenant — backfilled for legacy rows; set on become-host approval. */
  tenantId?: string | null;
  shopName: string;
  description: string | null;
  logo: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  createdAt: Date;
  updatedAt: Date;
}

