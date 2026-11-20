/**
 * Entity types mirroring Prisma models (scalar fields only).
 * Use instead of `@prisma/client` model types in store layers.
 */

import type {
  ActivityAudienceFitnessDTO,
  ActivityCountsDTO,
  ActivityDetailSchemaVersion,
  ActivityGearItemDTO,
  ActivityItineraryStepDTO,
  ActivityPolicyKeyDTO,
  ActivityPriceBreakdownDTO,
  DetailRevampConfidence,
  MemberVehicleColor,
  OutingCategory,
  OutingTopic,
} from '@uaetrail/shared-types';
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
  hiddenFromPublic?: boolean;
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
  /** Leaf rows grouped under a place hub (CPC — optional until admin seeds hubs). */
  parentPlaceId?: string | null;
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
  geoRef?: import('@uaetrail/shared-types').GeoRef | null;
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
    color: MemberVehicleColor;
    year: number;
  } | null;
  /** Parent hike/camp/event when this is a linked rideshare listing. */
  linkedActivityId: string | null;
  /** Linked rideshare activity id when a ride offer is enabled for this listing. */
  linkedRideshareActivityId: string | null;
  paymentTerms: string | null;
  pricingMode: 'free' | 'shared' | 'paid' | null;
  /** @deprecated v2 shell uses {@link itinerarySteps}; kept empty after Mongo migration. */
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
  geoRef?: import('@uaetrail/shared-types').GeoRef | null;
  activityMode?: 'hosted' | 'seeking' | null;
  participantIntentId?: string | null;
  /** On-ground guides. Pending rows stay off public DTOs. */
  guides?: ActivityGuideRecord[];
  /** Detail revamp — `2` after `migrateActivityDetailSchemaV2`. */
  schemaVersion?: ActivityDetailSchemaVersion;
  summary?: string | null;
  itinerarySteps?: ActivityItineraryStepDTO[];
  gear?: ActivityGearItemDTO[];
  waitlist?: boolean;
  counts?: ActivityCountsDTO;
  priceBreakdown?: ActivityPriceBreakdownDTO;
  policyKey?: ActivityPolicyKeyDTO;
  customPolicy?: string | null;
  audience?: {
    kidsWelcome: boolean;
    minAge?: number | null;
    petsAllowed: boolean;
    womenOnly: boolean;
    fitness: ActivityAudienceFitnessDTO;
    fitnessNote?: string | null;
    languages: string[];
    accessibility?: string | null;
  };
  waiverRequired?: boolean;
  needsReview?: string[];
  confidence?: Record<string, DetailRevampConfidence>;
  createdAt: Date;
  updatedAt: Date;
}

export type ActivityGuideRecord = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  status: 'accepted' | 'pending';
  assignedByUserId: string;
  assignedAt: Date;
  respondedAt: Date | null;
};

export type ActivityPartyMemberRecord = {
  membershipId: string;
  groupId: string;
  memberType: 'adult' | 'kid';
  userId: string | null;
  displayName: string;
  status: 'family_invited' | 'accepted' | 'declined' | 'host_pending' | 'confirmed';
};

export interface ActivityRequest {
  id: string;
  activityId: string;
  userId: string;
  status: RequestStatus;
  adults?: number;
  kids?: number;
  partyMembers?: ActivityPartyMemberRecord[];
  /** Approved participant; family/headcount bump still awaiting host confirmation. */
  partyApprovalPending?: boolean;
  /** `member_groups` id when join party was built from a team roster. */
  sourceTeamId?: string | null;
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
  allowInboundChat: boolean;
  showContactPhone: boolean;
  createdAt: Date;
  updatedAt: Date;
}

