import type { GroupRegionLevels } from './group-region.js';
import type { GroupWallReplyPreviewDTO } from './group-wall.js';
import type { DiscoveryCardPresentationDTO } from './explore-presentation.js';
import type { ExploreMapPersonDTO } from './explore-person.js';
import type { ActivityJoinInviteForViewerDTO } from './activity-join-invite.js';
import type { ActivityJoinMode } from './activity-join-mode.js';
import type { ActivityViewerAccessDTO } from './activity-viewer-access.js';
import type { ParticipationMode } from './activity-participation-mode.js';
import type {
  ExploreMapComposeIntent,
  OutingCategory,
  OutingTopic,
} from './explore-plan-projection.js';
import type { HostParticipantRosterStatus, ParticipantHostRatingDTO } from './participant-roster.js';
import type { MemberMedicalSafetyDTO } from './member-medical-safety.js';
import type { HostJoinProfileSnippetDTO } from './join-host-profile-disclosure.js';
import type { ExploreActivityMode } from './explore-activity-mode.js';
import type { ActivityGroupChatPostPolicy } from './activity-group-chat-post-policy.js';
import type { PlaceNearbyFacilityDTO } from './place-kind.js';
import type { PlaceViewerAccessDTO } from './place-viewer-access.js';
import type { ExploreMapSourceWire } from './wire-lexicon.js';
import type {
  ActivityAudienceFitnessDTO,
  ActivityCountsDTO,
  ActivityDetailSchemaVersion,
  ActivityGearItemDTO,
  ActivityItineraryStepDTO,
  ActivityPolicyKeyDTO,
  ActivityPriceBreakdownDTO,
} from './activity-detail-revamp.js';
import type { ActivityPartyMemberDTO } from './activity-party-roster.js';

export type {
  ActivityAudienceFitnessDTO,
  ActivityCountsDTO,
  ActivityDetailSchemaVersion,
  ActivityGearItemDTO,
  ActivityItineraryStepDTO,
  ActivityPolicyKeyDTO,
  ActivityPriceBreakdownDTO,
  DetailRevampConfidence,
} from './activity-detail-revamp.js';

export type UserRole =
  | 'platform_admin'
  | 'merchant_admin'
  | 'tenant_owner'
  | 'tenant_admin'
  | 'tenant_guide'
  | 'participant';

export type TenantType = 'company' | 'guide_owned';
export type MembershipRole = 'tenant_owner' | 'tenant_admin' | 'tenant_guide';

/** Scheduled listings on the map (host activities, rideshares). */
export type ScheduledActivityType = 'hiking' | 'camping' | 'event' | 'rideshare';

/** Wire `activityType` on place/location rows (includes community shop pins). */
export type PlaceActivityType = ScheduledActivityType | 'shop';

/** @deprecated Prefer {@link ScheduledActivityType} or {@link PlaceActivityType} by context. */
export type ActivityType = PlaceActivityType;
export type LocationStatus = 'draft' | 'active' | 'inactive';
export type ActivityStatus = 'draft' | 'published' | 'cancelled' | 'suspended';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'waitlisted';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  traceId: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * **Place** — single map/catalog entity (`locations` collection).
 * Typed by {@link PlaceKind}; wire field `activityType` is legacy for hiking/camping/event rows.
 */
export interface LocationDTO {
  id: string;
  name: string;
  region: string;
  /** Trailhead, wadi, or beach zone — list poster location chip (emirate stays in `region`). */
  placeHubLabel?: string | null;
  /** Curated **Destination** id (`GET /destinations/:slug`). */
  destinationId?: string | null;
  /** Leaf venue grouped under a destination hub place (`locations.id`). */
  parentPlaceId?: string | null;
  /** Populated on place detail reads when destination resolves to a published hub. */
  destinationSlug?: string | null;
  destinationName?: string | null;
  /** Destination hub lifecycle when `destinationId` is set. */
  destinationStatus?: 'draft' | 'published' | null;
  /** @deprecated Prefer {@link PlaceKind} in new code — persisted as `activityType` on Mongo today. */
  activityType: PlaceActivityType;
  description: string;
  difficulty?: 'easy' | 'moderate' | 'hard';
  season: string[];
  childFriendly: boolean;
  maxGroupSize?: number;
  accessibility?: 'car-accessible' | 'remote';
  images: string[];
  featured: boolean;
  status: LocationStatus;
  distance?: number;
  duration?: number;
  elevation?: number;
  campingType?: 'self-guided' | 'operator-led';
  latitude?: number | null;
  longitude?: number | null;
  highlights?: string[];
  surfaceType?: string[];
  tags?: string[];
  parkingLink?: string;
  parkingLat?: number | null;
  parkingLng?: number | null;
  /** Geography levels L1–L4 for map/list filters (see `group-region.ts`). */
  groupRegionLevels?: GroupRegionLevels | null;
  /** Country → state → area → optional venue chain (plan §18). */
  geoRef?: import('./geo-hierarchy.js').GeoRef | null;
  premiumImages?: string[];
  accessibleBy?: string[];
  viewCount?: number;
  countryCode?: string;
  submittedById?: string | null;
  /** Who registered this catalog row (CPC). Dual-read with {@link submittedById}. */
  registeredByUserId?: string | null;
  moderationStatus?: import('./catalog-lifecycle.js').CatalogModerationStatus;
  publicationStatus?: import('./catalog-lifecycle.js').CatalogPublicationStatus;
  /** Public-safe premium hints (no private file keys on consumer APIs). */
  hasRouteMap?: boolean;
  hasGuide?: boolean;
  guidePreview?: string | null;
  unlockPriceAed?: number;
  /** Admin-only — storage keys for GPX / PDF assets. */
  gpxKey?: string | null;
  guidePdfKey?: string | null;
  guideMarkdown?: string | null;
}

/** Domain alias — trail, camp, or event venue. Storage/API remain `locations` / `LocationDTO`. */
export type PlaceDTO = LocationDTO;
export type PlaceStatus = LocationStatus;

export type PremiumAccessReason = 'pro' | 'goat' | 'admin' | 'unlocked' | 'locked';

export interface LocationPremiumSummaryDTO {
  hasPremium: boolean;
  hasRouteMap: boolean;
  hasGuide: boolean;
  hasGuidePdf: boolean;
  unlockPriceAed: number;
  guidePreview: string | null;
  isUnlocked: boolean;
  accessReason: PremiumAccessReason;
  membershipTier: string;
}

export interface LocationGuideDTO {
  locationId: string;
  locationName: string;
  markdown: string | null;
  hasPdf: boolean;
}

/** Public-safe route preview for place detail (`GET /places/:id/track`) — no storage keys. */
export interface PlaceTrackPreviewDTO {
  /** Bounding box as GeoJSON order: `[west, south, east, north]` in degrees. */
  bbox: [number, number, number, number] | null;
  /** Encoded polyline (precision-5); decode client-side for map overlay. */
  polyline: string | null;
  /** Elevation profile samples as `[distanceMeters, elevationMeters][]` (optional). */
  profile: [number, number][] | null;
}

export interface PlaceTrackPreviewResponse {
  data: PlaceTrackPreviewDTO | null;
}

export type {
  PlaceReachableRideRowDTO,
  PlaceReachableRidesResponse,
} from './place-reachable-rides.js';

/** Normalized daily snapshot from `GET /weather` (Open-Meteo behind server cache). */
export interface WeatherDailySnapshotDTO {
  weatherCode: number | null;
  tempMaxC: number | null;
  tempMinC: number | null;
  precipProbabilityMax: number | null;
}

export interface WeatherForecastResponseDTO {
  provider: 'open-meteo';
  latitude: number;
  longitude: number;
  date: string;
  /** Reverse-geocoded label at the forecast pin (Open-Meteo coordinates). */
  locationName?: string | null;
  daily: WeatherDailySnapshotDTO;
  series: {
    time: string[];
    weathercode: number[] | null;
    temperature_2m_max: number[] | null;
    temperature_2m_min: number[] | null;
    precipitation_probability_max: number[] | null;
  };
}

export interface WeatherForecastResponse {
  data: WeatherForecastResponseDTO;
}

export interface LocationDetailResponse {
  data: LocationDTO;
  premium: LocationPremiumSummaryDTO | null;
  /** Facility POIs in the same curated destination as `data` (when `data.destinationId` is set). */
  nearbyFacilities?: PlaceNearbyFacilityDTO[];
  /** Signed-in overlay (`GET /places/:id/me/state`); public shell omits this. */
  viewerAccess?: PlaceViewerAccessDTO;
}

/** Domain aliases — place detail payloads (wire remains `Location*`). */
export type PlacePremiumSummaryDTO = LocationPremiumSummaryDTO;
export type PlaceGuideDTO = LocationGuideDTO;
export type PlaceDetailResponse = LocationDetailResponse;

export interface ParticipantPreviewDTO {
  id: string;
  name: string;
  avatar?: string | null;
}

export interface ActivityDTO {
  id: string;
  tenantId: string;
  tenantSlug: string;
  /**
   * Catalog **Place (site)** id (`locations` collection). Same value as {@link placeId}.
   * Activity geography: `locationId` → place → `destinationId`.
   */
  locationId: string;
  /** Synonym for {@link locationId} — preferred name in new clients. */
  placeId: string;
  locationName: string;
  region?: string;
  groupRegionLevels?: GroupRegionLevels | null;
  /** Denormalized from place at read time — not written on activity publish. */
  destinationId?: string | null;
  geoRef?: import('./geo-hierarchy.js').GeoRef | null;
  activityType: ScheduledActivityType;
  title: string;
  description: string;
  date: string;
  time: string;
  endDate?: string | null;
  endTime?: string | null;
  price: number;
  slotsTotal: number;
  slotsAvailable: number;
  status: ActivityStatus;
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
  rideshareEnabled?: boolean;
  rideshareFree?: boolean | null;
  ridesharePriceAed?: number | null;
  rideshareSeats?: number | null;
  rideshareDetails?: string | null;
  /** Linked member car for rideshare listings (plate only for ride crew on activity detail). */
  rideshareVehicleId?: string | null;
  rideshareVehicle?: import('./member-vehicle.js').RideshareVehiclePublicDTO | null;
  linkedActivityId?: string | null;
  linkedRideshareActivityId?: string | null;
  linkedRideshare?: ActivityDTO | null;
  linkedParentActivity?: {
    id: string;
    title: string;
    activityType?: string | null;
    description?: string | null;
    date?: string;
    time?: string | null;
    endDate?: string | null;
    endTime?: string | null;
  } | null;
  paymentTerms?: string | null;
  pricingMode?: 'free' | 'shared' | 'paid' | null;
  itinerary?: string[] | null;
  requirements?: string[] | null;
  /** Who can discover this activity on the explore map (`open`) vs link-only (`private`). */
  joinMode?: ActivityJoinMode;
  /** How members join: instant RSVP (`rsvp`) vs host approval queue (`approval`). */
  participationMode?: ParticipationMode;
  images?: string[];
  /** Wide hero banner (outdoor events) */
  bannerUrl?: string | null;
  /** Person responsible for hosting this activity on the ground */
  hostName?: string;
  hostUserId?: string;
  hostAvatar?: string;
  hostBio?: string | null;
  /** Guide / agency brand name when posting as business (not community). */
  tenantName?: string;
  /** Tenant logo — denormalized for list/peek so the FE does not wait on a profile fetch. */
  tenantLogoUrl?: string | null;
  /** How this activity was published — drives public name + profile link on explore/list. */
  publishingProfileKind?: PublishingProfileKind;
  /** Accepted on-ground guides (pending invites omitted). */
  guides?: ActivityGuidePublicDTO[];
  /** Accepted guide count — peek uses this instead of loading each profile. */
  acceptedGuideCount?: number;
  hostId?: string | null;
  /** User who created this activity */
  createdById?: string;
  createdByName?: string;
  featured?: boolean;
  participantPreviews?: ParticipantPreviewDTO[];
  countryCode?: string;
  /** Venue coordinates — used when meeting/start pins are missing. */
  locationLatitude?: number | null;
  locationLongitude?: number | null;
  /** Canonical map pin — resolved at mapper time from meeting/start/parking/venue. */
  displayLatitude?: number | null;
  displayLongitude?: number | null;
  /** Browse/match family when distinct from legacy `activityType` (e.g. generic activity wizard). */
  outingCategory?: OutingCategory | null;
  outingTopic?: OutingTopic | null;
  /** Activity crew chat — one group per outing (host list / manage). */
  groupChatId?: string | null;
  /** Crew group wall — who may post (`host_only` = host admin only; members may still read). */
  groupChatPostPolicy?: ActivityGroupChatPostPolicy | null;
  /** Discoverable club id when the outing is listed on a community page (`MIG-COMMUNITY-DISCOVER`). */
  discoverCommunityId?: string | null;
  /** Map/Plan mode — hosted outings only (`hosted` or omitted). */
  activityMode?: ExploreActivityMode | null;

  /**
   * Detail revamp (Mongo schema v2) — see `docs/DOMAIN_CANONICALS.md` §3.2.1 · `activity-detail-revamp.ts`.
   * `1` = legacy row; `2` = migrated / new writes.
   */
  schemaVersion?: ActivityDetailSchemaVersion;
  /** Card / hero subtitle — max ~160 chars when set. */
  summary?: string | null;
  /** Structured itinerary (replaces string[] `itinerary` on v2 rows). */
  itinerarySteps?: ActivityItineraryStepDTO[] | null;
  /** Icon gear checklist — mandatory, recommended, provided by host. */
  gear?: ActivityGearItemDTO[] | null;
  /** Whether waitlist is enabled when full. */
  waitlist?: boolean;
  /** Denormalized join counts (shell / detail). */
  counts?: ActivityCountsDTO | null;
  /** Structured price — v1 host-collected money uses `collectedBy: host`. */
  priceBreakdown?: ActivityPriceBreakdownDTO | null;
  /** Host cancellation preset key. */
  policyKey?: ActivityPolicyKeyDTO | null;
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
  } | null;
  waiverRequired?: boolean;
  /**
   * Crew / host surfaces — data from `activity_private` when the API merges it.
   * Omitted on public list/map payloads.
   */
  activityPrivateDetails?: {
    emergencyContact: { name: string; phone: string } | null;
    plateNumber: string | null;
  } | null;
}


export interface ActivityDetailDTO extends ActivityDTO {
  /** Shown on redacted / private stubs when the viewer cannot see full detail. */
  message?: string;
  organizerId?: string;
  participants?: ParticipantPreviewDTO[];
  location?: LocationDTO;
  myParticipation?: ActivityParticipationDTO | null;
  myRequest?: MyActivityRequestDTO | null;
  /** Set when the viewer has a pending Join me invite for this activity. */
  myJoinInvite?: ActivityJoinInviteForViewerDTO | null;
  /** Set when the viewer has a pending community guide invite for this activity. */
  myGuideInvite?: { status: 'pending' } | null;
}

export interface MyActivityDTO extends ActivityDTO {
  participation: ActivityParticipationDTO;
}

export interface ActivityParticipationDTO {
  participantId: string;
  requestId: string;
  status: 'confirmed';
  checkedInAt?: string | null;
  /** Always false — attendance is confirmed by the host only. */
  canCheckIn: boolean;
}

export interface MyActivityRequestDTO {
  id: string;
  status: RequestStatus;
  canWithdraw: boolean;
  adults?: number;
  kids?: number;
  /** Named family companions (adults invited / kids attached). */
  partyMembers?: ActivityPartyMemberDTO[];
  /** True when the join is approved but a later family/headcount increase still needs the host. */
  partyApprovalPending?: boolean;
  /** Family/friends team the roster was picked from — `social_groups.id`. */
  sourceTeamId?: string | null;
}

export interface JoinRequestDTO {
  id: string;
  activityId: string;
  userId: string;
  status: RequestStatus;
  waitlisted?: boolean;
  note?: string | null;
  hostNote?: string | null;
  cancelReason?: string | null;
  cancelMessage?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type {
  FriendRelationshipDTO,
  FriendRequestDTO,
  FriendRequestStatus,
  FriendSummaryDTO,
  FriendUserPreviewDTO,
} from './friend-connection.js';

export {
  resolveNotificationActorUserId,
  type NotificationKind,
  type NotificationMeta,
} from './notification-meta.js';
export {
  canonicalizeNotificationBookmarkPath,
  rewriteStaleNotificationBookmarkPath,
  INBOUND_STALE_CONSOLE_PREFIXES,
} from './notification-bookmark-path.js';
import type { NotificationMeta } from './notification-meta.js';

export type { MemberFollowStateDTO, MemberFollowSummaryDTO } from './member-follow.js';
export type {
  EntityFollowCheckDTO,
  EntityFollowDTO,
  EntityFollowKind,
  EntityFollowKindStored,
} from './entity-follow.js';
export { normalizeEntityFollowKind } from './entity-follow.js';
export { resolveExploreMapItemShopId } from './explore-shop-wire.js';
export type { WishlistCheckDTO, WishlistItemDTO } from './wishlist.js';
export type { MemberProfileStatsDTO } from './member-profile-stats.js';
export type { MemberBrowseCardDTO, MemberProfileViewStatsDTO } from './member-pro-engagement.js';
export {
  MEMBER_DISCOVERY_QUOTA_LIMIT,
  MEMBER_DISCOVERY_WINDOW_DAYS,
  buildMemberDiscoveryQuota,
  memberHasUnlimitedDiscovery,
  type MemberDiscoveryQuotaDTO,
} from './member-discovery-quota.js';
export type {
  MemberDiscoveryAvailabilityRowDTO,
  MemberDiscoveryRosterDTO,
} from './member-discovery-roster.js';
export type { CrewDiscoverFeedDTO, CrewDiscoverFeedMetaDTO } from './crew-discover-feed.js';
export { CREW_DISCOVER_FEED_SCHEMA_VERSION } from './crew-discover-feed.js';
export type {
  DiscoverCrewRecommendationBucket,
  DiscoverCrewRecommendationRowDTO,
  DiscoverCrewRecommendationsDTO,
  DiscoverMapRecommendationRowDTO,
  DiscoverMapRecommendationsDTO,
  DiscoverRecommendationSignal,
  DiscoverRecommendationSurface,
} from './discover-recommendations.js';
export { DISCOVER_RECOMMENDATIONS_SCHEMA_VERSION } from './discover-recommendations.js';
export {
  MAP_EXPLORE_RECOMMEND_MS_PER_DAY,
  MAP_EXPLORE_RECOMMEND_WEIGHTS,
  buildExploreMapRecommendationOrder,
  isExcludedFromMapExploreRecommendations,
  resolveExploreMapItemStartAtMs,
  scoreExploreMapCatalogItem,
  scoreMapExploreActivityCore,
  scoreMapExplorePlaceCore,
  applyMapExploreGeoBoost,
  haversineDistanceKm,
  type MapExploreRecommendationBoosts,
  type MapExploreRecommendationScore,
  type MapExploreViewerGeo,
} from './map-explore-recommendation-score.js';
export {
  DEFAULT_RECOMMENDED_CREW_FEED_CAPS,
  buildRecommendedCrewFeedRefs,
  filterDirectoryBrowseCards,
  type BuildRecommendedCrewFeedInput,
  type RecommendedCrewFeedBucket,
  type RecommendedCrewFeedCaps,
  type RecommendedCrewFeedRowRef,
} from './recommended-crew-feed.js';
export type {
  FriendActivityPresenceDTO,
  FriendActivityPresenceRowDTO,
  ExploreActivityRefDTO,
} from './friend-activity-presence.js';
export type {
  SocialPeopleDTO,
  SocialPeoplePreviewDTO,
  SocialPeoplePreviewPersonDTO,
  SocialPeopleSegment,
  SocialPeopleSegmentCanonical,
  SocialPeopleSegmentWire,
  SocialPeopleRelationship,
  SocialPersonFriendRequestState,
  SocialPersonRowDTO,
  SocialPersonTripHintDTO,
  SocialPersonTripRole,
} from './social-people.js';
export {
  ACTIVITY_JOIN_INVITE_DAILY_LIMIT_PER_ACTIVITY,
  ACTIVITY_JOIN_INVITE_WINDOW_MS,
  type ActivityJoinInviteForViewerDTO,
  type ActivityJoinInvitesSentDTO,
  type PendingActivityJoinInviteDTO,
} from './activity-join-invite.js';
export {
  MEMBER_COORDINATION_ATTENTION_KINDS,
  type MemberCoordinationAttentionDTO,
  type MemberCoordinationAttentionItemDTO,
  type MemberCoordinationAttentionKind,
} from './member-coordination-attention.js';
export type {
  HostPublishingTier,
  HostTierFlags,
  MemberProfileRoleLabel,
} from './host-publishing-tier.js';
import type { HostTierFlags, MemberProfileRoleLabel } from './host-publishing-tier.js';
import type { PublishingProfileKind } from './publishing-profile-kind.js';
import type { ActivityGuidePublicDTO } from './activity-guides.js';

export type HostApplicationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type HostProfileType = 'individual' | 'agency' | 'shop';

export type TenantBusinessMode = 'agency' | 'shop';

export type OwnedHostProfileType = 'guide' | 'agency' | 'shop';

export interface OwnedHostProfileDTO {
  type: OwnedHostProfileType;
  tenantId: string;
  name: string;
  slug: string;
  /** Resolved storefront kind for publish-as UI and public links. */
  publishingProfileKind?: PublishingProfileKind;
}

/**
 * Member publishing + publishing workspace eligibility (`GET /me/status`).
 * Single wire contract — clients must not re-derive tiers from `UserRole` alone.
 */
/** Server resolver shape (`resolveMemberStatus`) — not the `GET /me/status` HTTP wire (`MemberStatusDTO`). */
export interface HostStatusDTO {
  /** Signup completion (DOB, gender, based-in) — `/welcome` only. */
  profileComplete: boolean;
  /** Guide bio, languages, experience — gates community host / publish. */
  guideProfileComplete: boolean;
  medicalSafetyProfileComplete: boolean;
  /** First map publish (activity or seeking post) — earns Host badge. */
  isCommunityHost: boolean;
  /** Active tiers for this account (see `docs/MEMBER_MODEL.md`). */
  hostTiers: HostTierFlags;
  /** Canonical profile subtitle key — map with `memberProfileRoleLabel()`. */
  profileRoleLabel: MemberProfileRoleLabel;
  /** Can post Host / publish activities (community / pro / business tenant). */
  canPublish: boolean;
  /** Publishing workspace (publish queue, team) when publish-capable or business member. */
  canAccessOperatorWorkspace: boolean;
  /** Platform operator shell — not a community host tier. */
  isPlatformStaff: boolean;
  applicationStatus: HostApplicationStatus;
  tenantId: string | null;
  /** Tenant job role flag (server resolver only — not on `GET /me/status` wire). */
  isHostRole: boolean;
  hasTenant: boolean;
  tenantType: TenantType | null;
  businessMode: TenantBusinessMode | null;
  /** Verified business profile (agency / shop / partner) — paid pricing when publishing as that business. */
  canHostPaidActivities: boolean;
  hasGuideProfile: boolean;
  hasAgencyProfile: boolean;
  hasShopProfile: boolean;
  ownedProfiles: OwnedHostProfileDTO[];
}

/** Publish/workspace slice of {@link MemberStatusDTO} — not a separate HTTP resource. */
export interface MemberPublishCapabilitiesDTO {
  canPublish: boolean;
  canAccessOperatorWorkspace: boolean;
  /** Platform operator — use for admin shell; not `isCommunityHost`. */
  isPlatformStaff: boolean;
  canHostPaidActivities: boolean;
  applicationStatus: HostApplicationStatus;
  isCommunityHost: boolean;
  hostTiers: HostTierFlags;
  tenantId: string | null;
  hasTenant: boolean;
  tenantType: TenantType | null;
  businessMode: TenantBusinessMode | null;
  hasGuideProfile: boolean;
  hasAgencyProfile: boolean;
  hasShopProfile: boolean;
  ownedProfiles: OwnedHostProfileDTO[];
}

/**
 * Member capabilities (`GET /me/status` wire).
 * Publish/workspace fields live under {@link MemberPublishCapabilitiesDTO} only — not duplicated at the root.
 */
export type MemberStatusDTO = {
  profileComplete: boolean;
  guideProfileComplete: boolean;
  /** Blood group, medical conditions, emergency contact — required to join outings. */
  medicalSafetyProfileComplete: boolean;
  profileRoleLabel: MemberProfileRoleLabel;
  publish: MemberPublishCapabilitiesDTO;
};

export const buildMemberPublishCapabilities = (
  status: HostStatusDTO
): MemberPublishCapabilitiesDTO => ({
  canPublish: status.canPublish,
  canAccessOperatorWorkspace: status.canAccessOperatorWorkspace,
  isPlatformStaff: status.isPlatformStaff,
  canHostPaidActivities: status.canHostPaidActivities,
  applicationStatus: status.applicationStatus,
  isCommunityHost: status.isCommunityHost,
  hostTiers: status.hostTiers,
  tenantId: status.tenantId,
  hasTenant: status.hasTenant,
  tenantType: status.tenantType,
  businessMode: status.businessMode,
  hasGuideProfile: status.hasGuideProfile,
  hasAgencyProfile: status.hasAgencyProfile,
  hasShopProfile: status.hasShopProfile,
  ownedProfiles: status.ownedProfiles,
});

export const buildMemberStatusDto = (status: HostStatusDTO): MemberStatusDTO => ({
  profileComplete: status.profileComplete,
  guideProfileComplete: status.guideProfileComplete,
  medicalSafetyProfileComplete: status.medicalSafetyProfileComplete,
  profileRoleLabel: status.profileRoleLabel,
  publish: buildMemberPublishCapabilities(status),
});

/** Predefined reasons when a user withdraws from an activity */
export const WITHDRAW_REASONS = [
  { value: 'schedule_conflict', label: 'Schedule conflict' },
  { value: 'cant_attend', label: "Can't make it anymore" },
  { value: 'found_other', label: 'Found another activity' },
  { value: 'health', label: 'Health or personal reasons' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'other', label: 'Other' }
] as const;

export type WithdrawReason = (typeof WITHDRAW_REASONS)[number]['value'];

export const withdrawReasonLabel = (value: string): string =>
  WITHDRAW_REASONS.find((r) => r.value === value)?.label ?? value;

/** Predefined reasons when a host declines a join request */
export const HOST_JOIN_DECLINE_REASONS = [
  { value: 'activity_full', label: 'Activity is full' },
  { value: 'not_right_fit', label: 'Not the right fit for this outing' },
  { value: 'requirements_not_met', label: "Doesn't meet activity requirements" },
  { value: 'schedule_conflict', label: 'Schedule or timing conflict' },
  { value: 'safety_capacity', label: 'Safety or capacity limits' },
  { value: 'other', label: 'Other' },
] as const;

export type HostJoinDeclineReason = (typeof HOST_JOIN_DECLINE_REASONS)[number]['value'];

export const hostJoinDeclineReasonLabel = (value: string): string =>
  HOST_JOIN_DECLINE_REASONS.find((r) => r.value === value)?.label ?? value;

/** Text stored on the request and shown to the guest (notification + request detail). */
export const formatHostJoinDeclineNote = (
  reason: HostJoinDeclineReason,
  message?: string | null
): string => {
  const label = hostJoinDeclineReasonLabel(reason);
  const note = message?.trim();

  if (reason === 'other' && note) {
    return note;
  }
  if (note) {
    return `${label} — ${note}`;
  }
  return label;
};

/** Revoke-from-roster uses the same reason list as join decline. */
export const HOST_PARTICIPANT_REVOKE_REASONS = HOST_JOIN_DECLINE_REASONS;
export type HostParticipantRevokeReason = HostJoinDeclineReason;
export const hostParticipantRevokeReasonLabel = hostJoinDeclineReasonLabel;
export const formatHostParticipantRevokeNote = formatHostJoinDeclineNote;

export interface NotificationDTO {
  id: string;
  title: string;
  body: string;
  type: 'request_update' | 'system' | 'activity' | 'review_prompt';
  isRead: boolean;
  meta?: NotificationMeta | null;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string | null;
  avatarUrl?: string | null;
  switchedFromRole?: string | null;
  /** May grant/revoke other platform admins (master admin). */
  platformMasterAdmin?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  /** Omitted when refresh token is sent via httpOnly cookie. */
  refreshToken?: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

// ─── Chat DTOs ──────────────────────────────────────────────────────────────

export interface ChatConversationDTO {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export type ChatMessageReactionKind =
  | 'like'
  | 'dislike'
  | 'happy'
  | 'heart'
  | 'laugh'
  | 'mountain'
  | 'camping'
  | 'car';

export interface ChatMessageReactionDTO {
  kind: ChatMessageReactionKind;
  count: number;
  reactedByMe: boolean;
}

export interface ChatMessageDTO {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  activityId?: string;
  replyToMessageId?: string;
  replyToPreview?: GroupWallReplyPreviewDTO;
  readAt?: string;
  createdAt: string;
  reactions?: ChatMessageReactionDTO[];
}

// ─── Shop DTOs (profiles only — no product catalog) ─────────────────────────

export type ReviewTargetType = 'location' | 'tenant' | 'activity';

export interface ReviewDTO {
  id: string;
  targetType: ReviewTargetType;
  targetId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  userMembershipTier?: MembershipTierDTO | null;
  rating: number;
  comment: string;
  createdAt: string;
}

/** Signed-in member's review with resolved place / shop / host label and link. */
export interface MyReviewDTO extends ReviewDTO {
  targetLabel: string;
  targetPath: string;
}

export type ShopPresence = 'physical' | 'online';

export interface MerchantProfileDTO {
  id: string;
  /** Preferred shop profile id (`merchant_profiles._id`). Same as `id`. */
  shopId?: string;
  /** @deprecated Use shopId — legacy alias for the same id. */
  merchantId?: string;
  /** Linked shop tenant when merchant_profiles.tenantId is set. */
  tenantId?: string | null;
  shopName: string;
  description?: string;
  logo?: string;
  websiteUrl?: string | null;
  contactEmail?: string;
  contactPhone?: string;
  latitude?: number | null;
  longitude?: number | null;
  region?: string | null;
  contactPersonName?: string | null;
  contactPersonAvatar?: string | null;
  contactPersonUserId?: string | null;
  /** Owner opt-in: visitors may start an in-app chat with the shop contact. */
  allowInboundChat?: boolean;
  /** Owner opt-in: public pages and map peeks may show `contactPhone`. */
  showContactPhone?: boolean;
}


/** Public shop profile — same wire shape as {@link MerchantProfileDTO}. */
export type MerchantPublicDTO = MerchantProfileDTO;

/** Shop operator desk + public storefront payload (product name — storage may remain `merchant_profiles`). */
export type ShopOperatorProfileDTO = MerchantProfileDTO;

/** Domain alias — public shop page payload. */
export type ShopPublicDTO = MerchantPublicDTO;

export type ExploreMapKind = ActivityType | 'shop' | 'agency' | 'destination';
export type { ExploreMapSourceCanonical, ExploreMapSourceWire } from './wire-lexicon.js';
export type ExploreMapSource = ExploreMapSourceWire;

export type { ExploreDestinationLensStatsDTO } from './explore-destination-lens.js';
export { exploreDestinationLensStatsSummary } from './explore-destination-lens.js';

export type { ExploreActivityMode } from './explore-activity-mode.js';
export {
  exploreMapItemIsAvailabilityCatalog,
  exploreMapItemIsHostedActivity,
  exploreMapItemIsRetiredSeekingActivity,
  isRetiredSeekingActivityModeValue,
  isTimeBoundExploreMapItem,
  resolveExploreMapActivityMode,
  RETIRED_SEEKING_ACTIVITY_MODE,
} from './explore-activity-mode.js';
export type { RetiredSeekingActivityModeWire } from './explore-activity-mode.js';

export type ParticipantIntentKind = 'hiking' | 'camping' | 'event' | 'guide' | 'rideshare' | 'other';

/** Find / demand pin — public map only; join via intent requests (approve/reject), not RSVP. */
export interface ParticipantIntentDTO {
  id: string;
  userId: string;
  kind: ParticipantIntentKind;
  title: string;
  date: string | null;
  time: string | null;
  preferredArea: string | null;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: 'general' | 'specific' | null;
  toLatitude: number | null;
  toLongitude: number | null;
  partySize: number;
  comment: string;
  status: 'active' | 'fulfilled' | 'cancelled';
  convertedActivityId?: string | null;
  /**
   * Published map **Activity** for this find post (`activityMode: seeking` until fulfilled).
   * Same id space as hosted outings — use activity detail / join APIs with this id.
   */
  activityId?: string | null;
  /** @deprecated Use {@link activityId} — legacy M1 JSON field (same value when present). */
  seekingActivityId?: string | null;
  createdAt: string;
  requesterName?: string | null;
  requesterAvatar?: string | null;
}

/** Member asks to join someone else's demand; the poster is the host. */
export interface ParticipantIntentJoinRequestDTO {
  id: string;
  intentId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantIntentJoinRequestViewDTO extends ParticipantIntentJoinRequestDTO {
  requester?: {
    userId: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

export type ExplorePriceLabelKind = 'free' | 'paid' | 'shared';

/** Rich catalog fields for trail/camp location cards on explore. */
export interface ExploreLocationCardDTO {
  id: string;
  activityType: 'hiking' | 'camping' | 'event';
  region: string;
  /** Geography levels L1–L4 for map/list filters (see `group-region.ts`). */
  groupRegionLevels?: GroupRegionLevels | null;
  description: string;
  difficulty?: 'easy' | 'moderate' | 'hard';
  distance?: number;
  duration?: number;
  elevation?: number;
  childFriendly: boolean;
  accessibility?: 'car-accessible' | 'remote';
  campingType?: 'self-guided' | 'operator-led';
  maxGroupSize?: number;
  season: string[];
  surfaceType?: string[];
  images: string[];
  featured: boolean;
  parkingLat?: number | null;
  parkingLng?: number | null;
  parkingPoint?: string | null;
  /** Facility chips merged from catalog tags + linked amenities (`discovery-catalog-builder`). */
  amenityLabels?: string[];
}

/** Published rideshare linked to a parent hike/camp/event (explore map + peek). */
export interface ExploreLinkedRideshareDTO {
  activityId: string;
  exploreItemId: string;
  title: string;
  path: string;
  subtitle?: string | null;
}

/** Unified map/list item for the mobile explore experience. */
export interface ExploreMapItemDTO {
  id: string;
  kind: ExploreMapKind;
  source: ExploreMapSource;
  title: string;
  subtitle?: string | null;
  latitude: number | null;
  longitude: number | null;
  path: string;
  /** Primary person on this card — name is identity; role is contextual (host, requester, contact). */
  featuredPerson?: ExploreMapPersonDTO | null;
  date?: string | null;
  time?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  slotsAvailable?: number;
  slotsTotal?: number;
  participantPreviews?: ParticipantPreviewDTO[];
  image?: string | null;
  activity?: ActivityDTO;
  rideshareEnabled?: boolean;
  /** Shop profile id when `source` is `shop` (`merchant_profiles._id`). */
  shopId?: string | null;
  /** @deprecated Use {@link shopId} — same id; retired product term. */
  merchantId?: string;
  priceAed?: number | null;
  /** Carpool destination pin (Phase P2). */
  toLatitude?: number | null;
  toLongitude?: number | null;
  /** Server-computed display helpers for map cards (Phase P1). */
  priceLabel?: ExplorePriceLabelKind | null;
  priceDisplay?: string | null;
  fromLabel?: string | null;
  toLabel?: string | null;
  websiteUrl?: string | null;
  contactPhone?: string | null;
  /** Time-bound map mode — `hosted` for published outings. */
  activityMode?: 'hosted' | null;
  /** Curated Destination membership for explore filters (`destination` query). */
  destinationId?: string | null;
  destinationSlug?: string | null;
  destinationName?: string | null;
  geoRef?: import('./geo-hierarchy.js').GeoRef | null;
  /** Catalog place-hub bucket — under geo venue / curated destination; not the leaf spot name. */
  placeHubLabel?: string | null;
  groupRegionLevels?: GroupRegionLevels | null;
  /** Set when a host converts this request into a published activity. */
  convertedActivityId?: string | null;
  /** Shop/agency about one-liner for map cards. */
  about?: string | null;
  /** Trail/camp/event catalog fields for rich location list cards. */
  locationCard?: ExploreLocationCardDTO | null;
  /** Canonical catalog kind when wire `kind` alone is ambiguous (`event` amenities). */
  placeKind?: import('./place-kind.js').PlaceKind | null;
  /** Contributed catalog shop — `peek` (map only) vs operator shop `full` profile. */
  catalogProfileExposure?: import('./catalog-profile-exposure.js').CatalogProfileExposure | null;
  /** Aggregate review stats for venues (location) and shops/agencies (tenant). */
  averageRating?: number | null;
  reviewCount?: number;
  /** Server-built headlines, list titles, and card sections for explore UI. */
  presentation?: DiscoveryCardPresentationDTO;
  /** Tenant id when the map item represents a shop profile. */
  tenantId?: string | null;
  /** Gear shop map presence — physical stores get pins; online partners are list-only. */
  shopPresence?: ShopPresence | null;
  /** Discover home “Gear Shops” rail — platform admin only. */
  discoverFeatured?: boolean;
  /** Map browse projection (host vs seek). Null for venue/shop catalog rows. */
  composeIntent?: ExploreMapComposeIntent | null;
  /** Friends/activities browse family. Null for venue/shop. */
  outingCategory?: OutingCategory | null;
  /** Optional subtype within `outingCategory` (derive-on-read until E5 persistence). */
  outingTopic?: OutingTopic | null;
  /** Join mode for published hosted outings only. */
  participationMode?: ParticipationMode | null;
  /** Rideshare activities linked to this parent plan (parent rows only). */
  linkedRideshareActivities?: ExploreLinkedRideshareDTO[];
  /** Destination hub rollups (place/facility counts). Not a map pin — destination is an admin-curated name. */
  destinationLensStats?: import('./explore-destination-lens.js').ExploreDestinationLensStatsDTO | null;
  /**
   * Peek/detail hints. Public `GET /explore/map` is guest-level; signed-in members
   * replace this from `GET /me/discover/overlay`. Not stored in Redis payload.
   */
  viewerAccess?: ActivityViewerAccessDTO;
  /**
   * Slim L1 discovery read model (`EXPLORE_MAP_DISCOVERY_PROJECTION=1`).
   * Attached on `GET /explore/map` after cache read — not stored in Redis.
   */
  discoveryCard?: import('./discovery-card-projection.js').DiscoveryCardProjection | null;
  /** ISO timestamp — guest preview cap picks oldest posted events (server catalog assembly). */
  catalogPostedAt?: string | null;
  /** ISO timestamp — guest preview cap picks oldest updated places (server catalog assembly). */
  catalogUpdatedAt?: string | null;
}

/** Signed-in peek overlay keyed by public map item id (`GET /me/discover/overlay`). */
export interface ExploreMapOverlayItemDTO {
  id: string;
  viewerAccess: ActivityViewerAccessDTO;
}

export interface ExploreMapOverlayDTO {
  items: ExploreMapOverlayItemDTO[];
}

// ─── Admin DTOs ─────────────────────────────────────────────────────────────

export type UserStatusType = 'active' | 'suspended';

export type AdminUserType =
  | 'participant'
  | 'business_host'
  | 'guide_host'
  | 'host_staff'
  | 'platform_admin';

export type AuthProviderType = 'email' | 'google';

export interface UserListDTO {
  id: string;
  email: string;
  role: UserRole;
  userType?: AdminUserType;
  status: UserStatusType;
  authProvider?: AuthProviderType;
  displayName?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  lastActiveAt?: string | null;
}

export interface TenantListDTO {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  status: 'pending' | 'active' | 'suspended';
  ownerName: string;
  memberCount: number;
  activityCount: number;
  hiddenFromPublic?: boolean;
}

export interface OperatorHostDetailsDTO {
  experience?: string;
  languages?: string;
  age?: number;
  certificates?: string;
  notableHikes?: string;
  nationality?: string;
  residence?: string;
}

export interface TenantPublicTeamMemberDTO {
  role: string;
  displayName: string;
  avatarUrl: string | null;
}

/** Public tenant storefront — wire shape for `GET /tenants/:slug`. */
export interface TenantPublicDTO {
  id: string;
  name: string;
  slug: string;
  type: TenantType | string;
  businessMode?: string | null;
  description?: string | null;
  website?: string | null;
  region?: string | null;
  /** Optional map anchor — Place row id (shop, agency office, hotel, partner venue). */
  primarySiteAnchorPlaceId?: string | null;
  /** Optional map anchor — Facility row id when amenity-only pin. */
  primarySiteAnchorFacilityId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string | null;
  ownerBio: string | null;
  hostDetails?: OperatorHostDetailsDTO;
  memberCount: number;
  team: TenantPublicTeamMemberDTO[];
  activities: ActivityDTO[];
  /** Preferred shop public id when tenant is a shop. Wire: merchant_profiles._id */
  shopId?: string | null;
}

// ─── Member medical safety (join / host roster) ─────────────────────────────

export {
  BLOOD_GROUP_VALUES,
  EMERGENCY_CONTACT_RELATION_VALUES,
  MEDICAL_CONDITIONS_NA,
  formatBloodGroupLabel,
  isMedicalSafetyProfileComplete,
  toMemberMedicalSafetyDto,
} from './member-medical-safety.js';
export type {
  BloodGroup,
  EmergencyContactRelation,
  MemberMedicalSafetyDTO,
  MemberMedicalSafetyFields,
} from './member-medical-safety.js';

// ─── Participant DTO ────────────────────────────────────────────────────────

export type { HostParticipantRosterStatus, ParticipantHostRatingDTO } from './participant-roster.js';
export type {
  RideshareRiderRatingDimensionsDTO,
  RideshareRiderReputationDTO,
} from './rideshare-rider-reputation.js';
export type { CatalogEditRankingDTO, CatalogEditTrustLevel } from './catalog-edit-ranking.js';
export {
  CATALOG_EDIT_TRUST_LABELS,
  computeCatalogEditRanking,
  formatCatalogEditRankingSummary,
} from './catalog-edit-ranking.js';
export {
  MEMBER_VEHICLE_COLORS,
  formatRideshareVehicleLabel,
} from './member-vehicle.js';
export type {
  MemberVehicleColor,
  MemberVehicleDTO,
  RideshareVehiclePublicDTO,
  UpsertMemberVehicleInput,
} from './member-vehicle.js';

export interface ParticipantDTO {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  checkedInAt?: string;
  joinedAt: string;
  /** `going` until check-in; `attended` after host confirms attendance. */
  status: HostParticipantRosterStatus;
  hostRating?: ParticipantHostRatingDTO | null;
  /** Host-only — member safety profile when join/roster is visible. */
  medicalSafety?: MemberMedicalSafetyDTO | null;
  /** Host-only — gender/DOB when the outing has women-only or age rules. */
  joinProfile?: HostJoinProfileSnippetDTO | null;
  canConfirmAttendance: boolean;
  canRevoke: boolean;
  canRate: boolean;
}

// ─── Rewards / Trail Points ─────────────────────────────────────────────────

export type MembershipTierKey = 'free' | 'active' | 'pro' | 'goat';

export interface MembershipTierDTO {
  key: MembershipTierKey;
  name: string;
  minPoints: number;
  emoji?: string;
  tagline?: string;
  benefits?: string[];
}

export interface RewardLevelDTO {
  key: string;
  name: string;
  minPoints: number;
}

export interface RewardBadgeDTO {
  key: string;
  name: string;
  description: string;
  emoji: string;
  earned: boolean;
  earnedAt: string | null;
}

export interface RewardActivityDTO {
  id: string;
  action: string;
  points: number;
  label: string;
  createdAt: string;
}

export interface RewardPathSuggestionDTO {
  title: string;
  points: number;
  path: string;
  note?: string;
}

export interface RewardPathToNextTierDTO {
  pointsRemaining: number;
  nextTierName: string;
  nextTierKey: MembershipTierKey;
  nextTierEmoji?: string;
  suggestions: RewardPathSuggestionDTO[];
}

export interface RewardStatsDTO {
  activeCount: number;
  proCount: number;
  goatCount: number;
  contributorsCount: number;
  totalPointsAwarded: number;
  tierThresholds: Pick<MembershipTierDTO, 'key' | 'name' | 'minPoints' | 'emoji'>[];
}

export interface RewardSummaryDTO {
  /** False for business organizer accounts — they do not participate in Trail Points. */
  trailPointsEligible?: boolean;
  points: number;
  membershipTier: MembershipTierDTO;
  nextTier: (Pick<MembershipTierDTO, 'key' | 'name' | 'minPoints' | 'emoji'> & { pointsRemaining: number }) | null;
  pathToNextTier: RewardPathToNextTierDTO | null;
  /** @deprecated use membershipTier */
  level: RewardLevelDTO;
  /** @deprecated use nextTier */
  nextLevel: (RewardLevelDTO & { pointsRemaining: number }) | null;
  referralCode: string;
  tierBadges: RewardBadgeDTO[];
  badges: RewardBadgeDTO[];
  recentActivity: RewardActivityDTO[];
}

export interface RewardLeaderboardEntryDTO {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  points: number;
  tier: string;
  /** @deprecated use tier */
  level: string;
}

export interface RewardCatalogDTO {
  currencyName: string;
  membershipTiers: MembershipTierDTO[];
  /** @deprecated use membershipTiers */
  levels: RewardLevelDTO[];
  earnOpportunities: Array<{
    action: string;
    title: string;
    description: string;
    points: number;
  }>;
  pointValues: Record<string, number>;
}

export {
  seekingFallbackTitle,
  isGenericSeekingTitle,
  isEmbeddedPersonaSeekingTitle,
  normalizeEmbeddedPersonaSeekingTitle,
  type SeekingTitleKind,
} from './seeking-titles.js';

export {
  buildExploreFeaturedPerson,
  canonicalExploreMapPersonRole,
  explorePersonFirstName,
  explorePersonHeadlineName,
  explorePersonRoleLabel,
  formatExplorePersonDisplayName,
  resolveExploreFeaturedPerson,
  type ExploreFeaturedPersonInput,
  type ExploreMapPersonDTO,
  type ExploreMapPersonRole,
} from './explore-person.js';

export {
  ROLE_PLACEHOLDER_DISPLAY_NAME,
  HOST_FALLBACK_DISPLAY_NAME,
  hostPersonFirstName,
  isRolePlaceholderDisplayName,
  resolveActivityHostAvatar,
  resolveActivityHostDisplayName,
  resolveActivityHostUserId,
  resolveHostPersonDisplayName,
  showTenantBrand,
  type HostPersonNameInput,
} from './host-display.js';

export {
  ACCOUNT_ROLE_DISPLAY_SUFFIXES,
  isAccountRoleDisplaySuffix,
  resolveMemberDisplayName,
  stripAccountRoleDisplaySuffix,
  type AccountRoleDisplaySuffix,
} from './member-display-name.js';

export {
  exploreActivityPublisherTypeLabel,
  publishesActivityAsIndividual,
  resolveActivityHostReviewTarget,
  resolveActivityPublisherDisplayName,
  resolveActivityPublisherProfilePath,
} from './activity-publisher-display.js';

export {
  exploreActivityPublisherSectionNoun,
  resolveActivityHeadlinePersonName,
  resolveActivityPublisherRowPrimaryName,
  type ActivityActorNameInput,
} from './activity-actor-display.js';

export {
  HIKING_ACTIVITY_EMOJI,
  HIKING_VENUE_EMOJI,
  CAMPING_ACTIVITY_EMOJI,
  CAMPING_VENUE_EMOJI,
  SEEKING_EMOJI,
  EXPLORE_PLACES_LAYER_EMOJI,
  UAE_FLAG_EMOJI,
  RIDESHARE_EMOJI,
  SHOP_MAP_EMOJI,
  MAP_FILTER_EMOJI,
  MAP_LAYER_FILTER_EMOJI,
  buildDiscoveryCardPresentation,
  buildDiscoveryCardSections,
  buildExploreListWhen,
  buildExploreRouteLabel,
  normalizeRideshareRouteLabels,
  buildExploreSpotsSegment,
  buildExplorePeekSpotsLabel,
  buildActivitySpotsLeftLabel,
  buildExploreWhenSegment,
  exploreHeadline,
  explorePrimaryCtaLabel,
  exploreSecondaryCtaLabel,
  exploreSpotsLabel,
  exploreSubtitle,
  exploreVenueHint,
  formatExploreDayForHeadline,
  formatExploreDayShort,
  formatExploreCalendarDateShort,
  formatExploreClockFromDate,
  formatExploreEventDateLabel,
  formatExploreRelativeScheduleLabel,
  formatExploreTime,
  getExploreClockStyle,
  setExploreClockStyle,
  formatSeekingTitlePhrase,
  resolveExploreItemSource,
  resolveMapPinItemSource,
  resolveMapPinEmoji,
  FACILITY_MAP_SOURCE,
  PLACE_MAP_SOURCE,
  isFacilityMapSource,
  isGeographyMapSource,
  isPlaceMapSource,
  normalizeExploreMapSource,
  sanitizeExploreLocation,
  type ExploreClockStyle,
  type DiscoveryCardDetail,
  type DiscoveryCardDetailIcon,
  type DiscoveryCardKind,
  type DiscoveryCardPresentationDTO,
  type DiscoveryCardSections,
  type DiscoveryCardSource,
} from './explore-presentation.js';

export {
  buildDiscoveryCardProjectionFromMapItem,
  resolveDiscoveryCardEntityRef,
  type BuildDiscoveryCardProjectionOptions,
  type DiscoveryCardEntityRef,
  type DiscoveryCardProjection,
  type DiscoveryMapItemWire,
} from './discovery-card-projection.js';

export {
  activityHostTopicToOutingTopic,
  activityTypeToOutingCategory,
  buildExploreMapPlanProjection,
  deriveOutingTopicFromRequirements,
  exploreAvailabilityMapItemPath,
  exploreSeekingMapItemPath,
  resolveCrewExploreMapItemId,
  exploreMapKindToPlanMapKind,
  canonicalizeMapComposeIntent,
  exploreMapSourceToComposeIntent,
  outingCategoryToHostCreateKind,
  participantIntentKindToOutingCategory,
  resolveActivityOutingTopic,
  resolveHostCreateKindFromAvailabilityMapItem,
  OUTING_TOPICS,
  mapItemMatchesOutingTopic,
  parseOutingTopic,
  type ExploreMapKindForPlan,
  type ExploreMapPlanActivityKind,
  type ExploreMapPlanProjection,
  type ExploreMapPlanSource,
  type ExploreMapComposeIntent,
  type HostCreateKindWire,
  type OutingCategory,
  type OutingTopic,
  type ParticipantIntentKindForPlan,
} from './explore-plan-projection.js';

export {
  VENUE_NAME_AR_TAG_PREFIX,
  VENUE_NAME_EN_TAG_PREFIX,
  VENUE_AREA_TAG_PREFIX,
  deriveVenueAccessibilityFromAccessibleBy,
  formatVenueAreaTag,
  mergeVenueAreaTag,
  readVenueAreaFromTags,
  readVenueArabicNameFromTags,
  readVenueEnglishNameFromTags,
  readVenueAmenityChipLabels,
  resolvePlaceDisplayTitle,
  resolveVenueExploreLabels,
} from './venue-catalog-tags.js';

export {
  extractJoinInstructionLines,
  extractNonJoinRequirements,
  hasJoinInstructions,
  JOIN_INSTRUCTION_PREFIX,
} from './join-instructions.js';

export {
  defaultPolicyKeyForMode,
  extractActivityPlanDetailLinesForMigration,
  inferFitnessFromPlaceDifficulty,
  mapLegacyPricingToBreakdown,
  filterMigratedPlaceholderGear,
  migrateInstructionAndPlanLinesToGear,
  migrateLegacyItineraryStringsToSteps,
} from './activity-detail-revamp-migrate.js';

export {
  DEFAULT_HIKING_PACKING_ITEMS,
  PACKING_ACK_PREFIX,
  PACKING_ITEM_PREFIX,
  defaultHikingPackingItems,
  withHikingKitExtras,
  encodePackingListRequirements,
  formatPackingJoinNote,
  hasPackingList,
  isPackingRequirementLine,
  isPackingSignatureValid,
  missingRequiredPackingIds,
  movePackingItemInGroup,
  placePackingItem,
  optionalPackingItems,
  packingItemDisplay,
  packingLabelKey,
  parsePackingAckMode,
  parsePackingList,
  parsePackingListItems,
  requiredPackingItems,
  type PackingAckMode,
  type PackingItem,
} from './activity-packing-list.js';

export { extractActivityTransportRequirementLines } from './activity-transport-requirements.js';

export {
  inferJoinModeFromRequirements,
  PRIVATE_JOIN_REQUIREMENT_PREFIX,
  type ActivityJoinMode,
} from './activity-join-mode.js';

export {
  ACTIVITY_GROUP_CHAT_POST_POLICIES,
  resolveActivityGroupChatPostPolicy,
  type ActivityGroupChatPostPolicy,
} from './activity-group-chat-post-policy.js';

export {
  activityJoinEngagementSnapshotFromViewerFacts,
  activityViewerLevelCanAccessCrewSurfaces,
  activityViewerLevelFromJoinEngagement,
  activityViewerLevelHasFullDetail,
  computeActivityDetailExposure,
  type ActivityViewerAccessDTO,
  type ActivityViewerAccessLevel,
  type DetailExposure,
  type ViewerGateReason,
} from './activity-viewer-access.js';

export {
  computeActivityViewerEntitlements,
  mergeActivityMapPeekActionsWithEntitlements,
  type ActivityViewerEntitlementsDTO,
} from './activity-viewer-entitlements.js';

export {
  computeActivityMapPeekActions,
  type ActivityMapPeekAction,
  type ActivityMapPeekActionId,
  type ActivityMapPeekActionProminence,
  type MapPeekJoinRequestStatus,
} from './activity-map-peek-actions.js';

export {
  pickActivityPeekTwoSlotActions,
  type ActivityPeekTwoSlot,
} from './activity-peek-two-slot.js';

export {
  computeProfileDetailExposure,
  type ProfileDetailExposure,
  type ProfileVisibilitySetting,
  type ProfileViewerAccessDTO,
  type ProfileViewerAccessLevel,
} from './profile-viewer-access.js';

export {
  PROFILE_FIELD_AUDIENCES,
  PROFILE_FIELD_PRIVACY_KEYS,
  DEFAULT_PROFILE_FIELD_PRIVACY,
  canViewProfileField,
  mergeProfileFieldPrivacy,
  type ProfileFieldAudience,
  type ProfileFieldPrivacyKey,
  type ProfileFieldPrivacyPatch,
  type ProfileFieldPrivacySettings,
} from './profile-field-privacy.js';

export {
  PROFILE_DATE_OF_BIRTH_SHARE_LEVELS,
  DEFAULT_PROFILE_DATE_OF_BIRTH_SHARE,
  mergeProfileDateOfBirthShare,
  computeAgeFromIsoDateOfBirth,
  monthDayFromIsoDateOfBirth,
  formatProfileMonthDayLabel,
  resolveMemberCardDateOfBirth,
  type ProfileDateOfBirthShare,
  type MemberCardDateOfBirthSlice,
} from './profile-date-of-birth-share.js';

export {
  PROFILE_FRIENDS_LIST_SHARE_LEVELS,
  DEFAULT_PROFILE_FRIENDS_LIST_SHARE,
  mergeProfileFriendsListShare,
  resolveProfileFriendsListVisibility,
  type ProfileFriendsListShare,
  type ProfileFriendsListVisibility,
} from './profile-friends-list-share.js';

export {
  FIND_CREW_VISIBILITY_LEVELS,
  DEFAULT_FIND_CREW_VISIBILITY,
  mergeFindCrewVisibility,
  viewerMaySeeInFindCrew,
  viewerMaySeeMemberLocation,
  type FindCrewVisibility,
  type FindCrewViewerRelation,
} from './find-crew-visibility.js';

export { type MemberProfileSocialGraphDTO } from './member-profile-social-graph.js';

export {
  resolveJoinHostProfileDisclosureNeeds,
  hostJoinProfileSnippetFromProfile,
  joinHostProfileShareNotice,
  type JoinHostProfileDisclosureNeeds,
  type HostJoinProfileSnippetDTO,
} from './join-host-profile-disclosure.js';

export {
  NOTIFICATION_PREFERENCE_TOPICS,
  NOTIFICATION_DND_MODES,
  DEFAULT_NOTIFICATION_PREFERENCE_SETTINGS,
  mergeNotificationPreferenceSettings,
  isNotificationDndActive,
  resolveNotificationPreferenceTopic,
  shouldDeliverNotification,
  type NotificationPreferenceTopic,
  type NotificationDndMode,
  type NotificationChannelPrefs,
  type NotificationDndSettings,
  type NotificationPreferenceSettings,
  type NotificationDeliveryChannel,
} from './notification-preferences.js';

export {
  type BusinessProSubtype,
  type ProMembershipPath,
  type PublishingProfileKind,
  isActivityPublishingProfileType,
  resolvePublishingProfileKind,
  inferHostStorefrontKindFromTenantWire,
} from './publishing-profile-kind.js';

export type {
  PublishingActivityPrivateCrewBodyFields,
  PublishingActivityUpsertBody,
} from './publishing-activity-private-body.js';

export {
  resolveCommerceMapViewerAccess,
  resolvePublicPlaceMapViewerAccess,
} from './catalog-viewer-access.js';

export { isGuideProfileComplete, type GuideProfileFields } from './guide-profile.js';

export {
  memberAudienceMayAttemptHostPublish,
  memberHasHostFootprintBadge,
  memberGuideProfileComplete,
  memberProfileComplete,
  hostPublishEntitlementDenial,
  resolveMemberAudience,
  resolvePaidMembershipSku,
  viewerMayBrowsePublicMemberDirectory,
  viewerMaySeeProfileViewStats,
  type MemberAudience,
  type MemberEntitlementDenial,
  type MemberEntitlementId,
  type PaidMembershipSku,
  type HostStatusAudienceSnapshot,
} from './member-access.js';

export {
  ACTIVITY_GUEST_JOIN_LABEL,
  APPROVAL_PARTICIPATION_REQUIREMENT,
  RSVP_PARTICIPATION_REQUIREMENT,
  activityJoinCtaLabel,
  inferParticipationModeFromRequirements,
  resolveParticipationMode,
  resolveParticipationModeForJoinMode,
  type ParticipationMode,
} from './activity-participation-mode.js';

export {
  ACTIVE_JOIN_REQUEST_WIRE_STATUSES,
  canWithdrawJoinRequestStatus,
  isActiveJoinRequestWireStatus,
  isInFlightJoinRequestWireStatus,
  mapPeekJoinRequestStatusFromSnapshot,
  mapPeekJoinRequestStatusFromUiKind,
  mapPeekJoinRequestStatusFromWire,
  normalizeJoinRequestWireStatus,
  activityJoinEngagementSnapshotFromMapPeekWire,
  projectActivityJoinRequestUiState,
  projectJoinRequestUiFromMapPeekWire,
  resolveActivityJoinEngagementKind,
  resolveActivityJoinEngagementPhase,
  type ActiveJoinRequestWireStatus,
  type ActivityJoinEngagementKind,
  type ActivityJoinEngagementPhase,
  type ActivityJoinEngagementSnapshot,
  type ActivityJoinInFlightStatus,
  type ActivityJoinRequestUiProjection,
  type ActivityJoinUiKindProjection,
} from './activity-join-engagement.js';

export {
  ACTIVITY_CATALOG_STATUSES,
  activityCatalogAllows,
  activityCatalogDenialMessage,
  activityIsConsumerDiscoverable,
  isActivityCatalogStatus,
  isCancelledActivityStatus,
  isDraftActivityStatus,
  isPublishedActivityStatus,
  isSuspendedActivityStatus,
  normalizeActivityCatalogStatus,
  resolveActivityCatalogRemoveKind,
  type ActivityCatalogAction,
  type ActivityCatalogStatus,
} from './activity-catalog-status.js';

export { resolveActivityPartyHeadcount } from './activity-party-headcount.js';

export {
  derivePartyHeadcountFromRoster,
  partyRosterHasPendingFamilyInvite,
  type ActivityPartyMemberDTO,
  type ActivityPartyMemberStatus,
} from './activity-party-roster.js';

export {
  ACTIVITY_DETAIL_TAB_IDS,
  resolveActivityDetailTabFooterKind,
  type ActivityDetailTabFooterInput,
  type ActivityDetailTabFooterKind,
  type ActivityDetailTabId,
} from './activity-detail-tab-footers.js';

export {
  buildActivityPresentationDTO,
  type ActivityDetailParticipantsSlot,
  type ActivityPresentationConsumerLayoutDTO,
  type ActivityPresentationDTO,
  type ActivityPresentationEngagementDTO,
  type ActivityPresentationSectionsDTO,
  type BuildActivityPresentationInput,
} from './activity-detail-presentation.js';

export {
  projectActivityMapPeekActions,
  resolveActivityEngagementMapPeekActionsBase,
  resolveActivityEngagementMapPeekStrips,
  resolveActivityEngagementPolicy,
  type ActivityEngagementCapabilities,
  type ActivityEngagementIntent,
  type ActivityEngagementIntentId,
  type ActivityEngagementPolicyDTO,
  type ActivityEngagementStripsDTO,
  type ResolveActivityEngagementPolicyInput,
} from './activity-engagement-policy.js';

export {
  isWomenOnlyActivityRequirements,
  resolveWomenOnlyJoinEligibility,
  womenOnlyJoinBlockMessage,
  type UserGenderWire,
  type WomenOnlyJoinEligibility,
} from './activity-audience-requirements.js';

export { MAX_MEMBER_GOALS } from './member-goals.js';

export type {
  MemberGoalActivityFilter,
  MemberGoalCountMode,
  MemberGoalDTO,
  MemberGoalPublicDTO,
  UpsertMemberGoalInput,
} from './member-goals.js';

export {
  AVAILABILITY_KINDS,
  areMemberAvailabilityDaysContiguous,
  availabilitySlotOverlapsRange,
  expandMemberAvailabilitySlotDays,
  groupConsecutiveMemberAvailabilityDays,
  isValidAvailabilitySlot,
  memberAvailabilityCalendarDays,
  memberAvailabilitySlotsAsDayPicks,
  normalizeMemberAvailabilitySlotsForStorage,
  prunePastAvailabilitySlots,
  availabilityKindMatchesActivityType,
  availabilityKindsForActivityType,
  availabilityMapItemId,
  parseAvailabilityMapItemId,
  isFixedAvailabilitySlot,
  isOpenAvailabilitySlot,
  isFriendsOnlyAvailabilityVisibility,
  normalizeAvailabilityVisibility,
  SCHEDULE_MODALITIES,
  AVAILABILITY_SLOT_CAPACITIES,
  AVAILABILITY_PRICING_KINDS,
  AVAILABILITY_TOUR_SHAPES,
  deriveModalitiesFromSlots,
  hydrateMemberAvailabilitySlots,
  normalizeAvailabilitySlot,
  validateMemberAvailabilityWrite,
  isScheduleModality,
  formatAvailabilitySlotLogisticsLine,
  formatAvailabilitySlotPartyLine,
  formatAvailabilitySlotTransportLine,
  sanitizeAvailabilitySlotLogistics,
  sanitizeDestinationRegions,
  destinationRegionsOverlap,
  MAX_AVAILABILITY_DESTINATION_REGIONS,
} from './member-availability.js';
export type { MemberAvailabilityDayBlock } from './member-availability.js';
export type {
  AvailabilityKind,
  AvailabilityScheduleKind,
  AvailabilityTimeBand,
  AvailabilityVisibility,
  ExploreAvailabilityClusterDTO,
  ExploreAvailablePersonDTO,
  MemberAvailabilityDTO,
  MemberAvailabilityPublicDTO,
  MemberAvailabilityMatchPreviewDTO,
  MemberAvailabilitySlotDTO,
  UpsertMemberAvailabilityInput,
  AvailabilityEngagementTerms,
  AvailabilitySlotCapacity,
  ScheduleModality,
  AvailabilityPricingKind,
  AvailabilityTourShape,
} from './member-availability.js';
export type {
  AvailabilitySlotTransportMode,
  AvailabilitySlotVehicleType,
} from './availability-slot-logistics.js';

export {
  discoveryKindsFromSlots,
  discoveryModalitiesFromSlots,
  memberHasGuideCapacityInSlots,
  personMatchesAvailabilityKindQuery,
  primaryMapPinKindFromSlot,
  slotsOverlappingRange,
} from './availability-discovery-projection.js';

export {
  defaultGuideEngagementTerms,
  formatEngagementTermsPricingLabel,
  formatGuideEngagementTermsBrowseLine,
  guideEngagementTermsBrowseLineFromSlots,
  pickGuideEngagementTermsFromSlots,
} from './availability-engagement-terms.js';

export {
  MEMBER_MAP_PIN_ACTIVITY_TYPES,
  type MemberMapPinActivityType,
} from './member-map-pin-activity-type.js';

export type {
  CreateMemberMapPinInput,
  MemberJourneyMapDTO,
  MemberJourneyMapStatsDTO,
  MemberMapPinDTO,
  MemberMapPinKind,
  MemberMapPinSource,
  UpdateMemberMapPinInput,
} from './member-map-pins.js';

export type {
  JourneyMapEntryCategory,
  JourneyMapEntryDTO,
  JourneyMapFilterCategory,
} from './outdoor-map-entries.js';

export {
  buildExploreActivityDisplay,
  resolveExplorePrice,
  type ExploreActivityDisplayFields,
  type ExplorePriceInfo,
} from './explore-price.js';

export {
  resolveActivityDestinationCoordinates,
  resolveActivityDisplayCoordinates,
  type ActivityCoordinateSource,
} from './activity-coordinates.js';

export {
  BROWSE_GROUP_REGION_FILTER_LEVEL_BY_COUNTRY,
  GROUP_REGION_LEVEL,
  browseGroupRegionFilterLevel,
  buildGroupRegionLevels,
  emptyGroupRegionLevels,
  groupRegionLevelTexts,
  readGroupRegionAtLevel,
  resolveGroupRegionBrowseKey,
  sameGroupRegionLevels,
  writeGroupRegionAtLevel,
  type GroupRegionLevel,
  type GroupRegionLevels,
} from './group-region.js';

export {
  UAE_GROUP_REGION_AREA_LABELS,
  groupRegionAnchorForLabel,
  inferEmirateFromLocalityName,
  normalizeGroupRegionLabel,
  resolveGroupRegionAreaAnchor,
  resolveGroupRegionFromCoordinates,
  resolveGroupRegionLabel,
  stampGroupRegionLevelsFromGeo,
  type GroupRegionAreaAnchor,
  type GroupRegionResolutionInput,
  type StampGroupRegionLevelsGeoInput,
  type UaeGroupRegionCatalogLabel,
} from './group-region-geo.js';

export {
  ACTIVITY_PRICING_INDICATION_NOTE,
  allowedActivityPricingModes,
  publishingProfileKindAllowsPaidActivities,
  activityHasPaidPricing,
  activityPriceLabel,
  activityPricingModeLabel,
  eventHasPaidPricing,
  inferActivityPricingMode,
  normalizeActivityPricing,
  type ActivityPricingContext,
  type ActivityPricingInput,
  type ActivityPricingMode,
  type ActivityPricingPublishProfile,
} from './activity-pricing.js';

export {
  activityHasJoinedParticipants,
  activityJoinIsFull,
  deriveActivityAvailability,
  isActivityFull,
  type ActivityAvailabilityInput,
  type ActivityAvailabilityStatus,
  type ActivityJoinCapacityInput,
  type ActivityJoinCountInput,
} from './activity-availability.js';

export {
  acceptedActivityGuides,
  activityGuideConsentRequired,
  activityGuideCountLabel,
  resolveActivityPublisherChip,
  type ActivityGuideHostDTO,
  type ActivityGuidePublicDTO,
  type ActivityGuideStatus,
  type ActivityPublisherChip,
  type ActivityPublisherChipInput,
  type ActivityPublisherChipKind,
} from './activity-guides.js';

export {
  EXPLORE_SHOPS_LIST_PATH,
  EXPLORE_SHOPS_PATH,
  activityDetailPath,
  activityDetailInvitePath,
  exploreActivityInvitePath,
  AGENCY_PROFILE_PATH_PREFIX,
  INBOUND_EVENT_VENUE_PATH_PREFIX,
  PARTNER_PROFILE_PATH_PREFIX,
  VENUE_PLACE_PATH_PREFIX,
  agencyProfilePath,
  hostBrandProfilePath,
  memberProfilePath,
  type MemberProfileBrowseLens,
  type MemberProfilePathOptions,
  normalizePlaceActivityType,
  partnerProfilePath,
  parseEntityRefFromPathname,
  placeDetailPath,
  placeDetailPathForId,
  canonicalPlaceDetailPath,
  inboundKindPlaceDetailPath,
  rewriteStaleEntityInboundPath,
  canonicalizeInboundProductPath,
  PLACE_CANONICAL_PATH_PREFIX,
  facilityDetailPath,
  resolveEntityPath,
  activityCrewPath,
  shopPublicPath,
  type EntityKind,
  type EntityRef,
  type PlaceVenueKind,
  type ResolveEntityPathOptions,
} from './entity-path.js';

export {
  ADDABLE_FACILITY_PLACE_KINDS,
  PLACE_CATALOG_KINDS,
  FACILITY_PLACE_KINDS,
  isAddableFacilityPlaceKind,
  isPlaceCatalogKind,
  PLACE_KINDS,
  PLACE_KIND_LABELS,
  PLACE_STORAGE_COLLECTION,
  exploreVenueIsPlacesSpot,
  facilityPlaceKindPinEmoji,
  isFacilityPlaceKind,
  isLocationActivityTypeWire,
  isPlaceKind,
  locationActivityTypeForPlaceKind,
  placeDetailRouteKindFromPlaceKind,
  amenityChipLabelForFacilityKind,
  placeKindFromAddVenueKind,
  placeKindFromLocationRow,
  tagsForPlaceKind,
  type PlaceCatalogKind,
  type LocationActivityTypeWire,
  type PlaceDetailRouteKind,
  type PlaceKind,
  type PlaceNearbyFacilityDTO,
} from './place-kind.js';

export {
  CATALOG_ACTION_IDS,
  type CatalogActionId,
} from './catalog-actions.js';

export {
  CATALOG_MODERATION_STATUSES,
  CATALOG_PUBLICATION_STATUSES,
  type CatalogModerationStatus,
  type CatalogPublicationStatus,
} from './catalog-lifecycle.js';

export type {
  FacilityCatalogQuery,
  PlaceCatalogPurpose,
  PlaceCatalogQuery,
  PlaceCatalogSegment,
} from './catalog-query.js';

export { normalizeFacilityCatalogQuery, normalizePlaceCatalogQuery } from './catalog-query-normalize.js';
export {
  readPlaceHubLabel,
  placeHubLabelMongoPatch,
  type PlaceHubLabelDoc,
} from './place-hub-label.js';

export { FACILITY_KINDS, isFacilityKind, type FacilityKind } from './facility-kind.js';

export type {
  AmenityState,
  FacilityAmenityReportPendingReview,
  FacilityDTO,
} from './facility.js';

export type {
  PlatformAlertScope,
  PlatformAlertSeverity,
  PublicActiveAlertDTO,
  PublicActiveAlertsResponse,
  AdminPlatformAlertDTO,
} from './platform-alert.js';

export type { ReferralClickEntityKind, ReferralClickRequestDTO } from './referral-click.js';

export type { FacilityViewerAccessDTO, FacilityViewerAccessLevel } from './facility-viewer-access.js';

export type { PlaceViewerAccessDTO, PlaceViewerAccessLevel } from './place-viewer-access.js';

export {
  computeFacilityViewerAccess,
  computePlaceViewerAccess,
  resolveCatalogSubmitterUserId,
  resolveCatalogViewerLevel,
} from './catalog-detail-exposure.js';

export {
  canonicalizeComposeWire,
  formatComposeWire,
  parseComposeWire,
  ACTIVITY_COMPOSE_KINDS,
  INTENT_FIXED_COMPOSE_KINDS,
  PLACE_COMPOSE_KINDS,
  type ActivityComposeKind,
  type ComposeKind,
  type ExploreComposeWire,
  type IntentComposeMode,
  type IntentFixedComposeKind,
  type PlaceComposeKind,
  type PlaceTarget,
} from './compose-route.js';

export {
  COMMUNITY_SHOP_TAG,
  decodeCommunityShopTags,
  encodeCommunityShopTags,
  type DecodedCommunityShopTags,
  type CommunityShopTagInput,
} from './community-shop-tags.js';

export {
  exploreMapPeekPath,
  isPeekOnlyCatalogProfile,
  type CatalogProfileExposure,
} from './catalog-profile-exposure.js';

export type {
  GroupWallMessageAuthorDTO,
  GroupWallPostPolicy,
  GroupWallReplyPreviewDTO,
  GroupWallStreamEventDTO,
  GroupWallStreamMessageDTO,
  SocialGroupChatPreviewDTO,
} from './group-wall.js';

export { groupWallBodySnippet } from './group-wall.js';
export {
  SOCIAL_GROUP_NAME_MIN_LENGTH,
  SOCIAL_GROUP_NAME_MAX_LENGTH,
  SOCIAL_TEAM_KID_ROSTER_MAX_AGE_YEARS,
  SOCIAL_TEAM_LABEL_TYPES,
  isSocialTeamLabelType,
} from './social-group-limits.js';
export type { SocialTeamLabelType } from './social-group-limits.js';
export {
  MEMBER_GROUP_INBOUND_LABELS,
  MEMBER_GROUP_INBOUND_TYPES,
  MEMBER_GROUP_KINDS,
  isMemberGroupKind,
  isMemberGroupTeamRow,
  isOutingCrewGroupRow,
  isOutingCrewMemberGroup,
  memberGroupInboundTypeFromKind,
  memberGroupInboundTypeLabel,
  memberGroupKindFromInboundType,
  memberGroupRowLabel,
  memberGroupTeamLabelFromInboundType,
  normalizeMemberGroupKind,
  resolveMemberGroupShape,
  teamAllowsKidRoster,
} from './member-group.js';
export type { MemberGroupInboundType, MemberGroupKind } from './member-group.js';

export type {
  AdminCommunityDetailDTO,
  AdminCommunityHostContactDTO,
  AdminCommunityListItemDTO,
  AdminCommunityInviteRowDTO,
  AdminCommunityMemberRowDTO,
  CommunityInviteStatus,
  CommunityDiscoverCardDTO,
  CommunityDiscoverDetailDTO,
  CommunityDiscoverVisibility,
  CommunityGroupStatus,
  CommunityJoinPolicy,
  CommunityMembershipStatus,
  CommunityViewerMembershipDTO,
  CommunityHostProfilePatchDTO,
  CommunityDiscoverActivitiesDTO,
  MeCommunityDiscoverListDTO,
  MeCommunityDiscoverRowDTO,
  MeCommunityDiscoverRelation,
  MeCreateCommunityDiscoverDTO,
  CommunityHostManageDTO,
  CommunityHostAdminRowDTO,
  CommunityHostAdminRole,
  CommunityHostMemberRowDTO,
} from './community-discover.js';
export {
  COMMUNITY_DISCOVER_VISIBILITY,
  COMMUNITY_GROUP_STATUSES,
  COMMUNITY_INVITE_STATUSES,
  COMMUNITY_JOIN_POLICIES,
  COMMUNITY_MEMBERSHIP_STATUSES,
  compareCommunityDiscoverByGeo,
  slugifyCommunityDiscoverName,
} from './community-discover.js';

export type { PlatformLayer, ProductModule } from './platform-layers.js';
export {
  JOIN_LAYER_MODULES,
  MODULE_LAYER_MATRIX,
  PLATFORM_LAYERS,
  isPlatformLayer,
} from './platform-layers.js';

export { PLATFORM_LAYER_API_MODULES, apiDomainModulesForLayer } from './platform-layer-api.js';

export type {
  ConnectActionId,
  DiscoverActionId,
  JoinActionId,
  LayerActionId,
  ManageActionId,
  PlaceActionId,
  PlanActionId,
  PublishActionId,
  SurfaceActionDTO,
} from './platform-surface-action.js';
export {
  CONNECT_ACTION_IDS,
  DISCOVER_ACTION_IDS,
  JOIN_ACTION_IDS,
  LAYER_ACTION_WIRE,
  MANAGE_ACTION_IDS,
  PLACE_ACTION_IDS,
  PLAN_ACTION_IDS,
  PUBLISH_ACTION_IDS,
  layerForCatalogAction,
  layerForPeekAction,
  projectCatalogSurfaceActions,
  projectSurfaceActions,
} from './platform-surface-action.js';

export type { CrewPillarBoundedContext, CrewPillarId, CrewPillarSpec, CrewPeopleFacetWire } from './crew-pillars.js';
export {
  CREW_PILLAR_IDS,
  CREW_PILLAR_SPECS,
  crewPeopleFacetToPillar,
  isCrewPillarId,
} from './crew-pillars.js';

export type { CrewPeopleSurfaceManifestId, CrewPeopleSurfaceWire } from './crew-people-surfaces.js';
export {
  CREW_PEOPLE_SURFACE_MANIFEST_IDS,
  CREW_PEOPLE_SURFACE_URL_PARAM,
  CREW_PEOPLE_SURFACE_WIRE,
  DEFAULT_CREW_PEOPLE_SURFACE_WIRE,
  crewPeopleSurfaceWireToManifest,
  isCrewPeopleSurfaceWire,
} from './crew-people-surfaces.js';

export type {
  DestinationBoundsRing,
  DestinationCenter,
  DestinationDTO,
  DestinationPublicDTO,
  DestinationStatus,
} from './destination.js';
export {
  BWL_ACTIVITY_PLACE_FIELDS,
  resolveActivityPlaceLinkId,
  withActivityPlaceIdAlias,
  type ActivityPlaceLinkWire,
} from './activity-place-wire.js';

export {
  approximateDestinationBoundsKm2,
  catalogDestinationIdUpdate,
  destinationHubPath,
  exploreDestinationQueryParam,
  exploreMapItemMatchesDestinationSlug,
  filterExploreMapItemsByDestinationSlug,
  pointInDestinationBounds,
  resolveDestinationId,
  resolveExploreDestinationSlugQuery,
  type DestinationAssignableRow,
  type ExploreDestinationSlugQuery,
  type ExploreMapDestinationLensItem,
} from './destination.js';

export {
  CURATED_DESTINATION_SEED_IDS,
  CURATED_DESTINATION_SEED_SLUGS,
  curatedDestinationSeedId,
  type CuratedDestinationSeedKey,
} from './curated-destination-seeds.js';

export {
  CURATED_DESTINATION_CATALOG,
  CURATED_DESTINATION_CATALOG_BY_KEY,
  CURATED_DESTINATION_CATALOG_BY_SLUG,
  listCuratedDestinationSeedKeys,
  type CuratedDestinationCatalogEntry,
  type CuratedDestinationBBox,
} from './curated-destination-catalog.js';

export type { MemberInboxGroupDTO } from './member-inbox.js';

export interface MemberInboxDTO {
  direct: ChatConversationDTO[];
  groups: import('./member-inbox.js').MemberInboxGroupDTO[];
  /** When true, direct rows may be incomplete due to a policy evaluation error. */
  directConversationsDegraded?: boolean;
}

export {
  activityPublicMetaDescription,
  buildActivityEventJsonLd,
  type ActivityPublicSeoFields,
} from './activity-public-seo.js';

export {
  activityInstantHasEnded,
  activityScheduleHasEnded,
  activityScheduleIncludesDate,
  activityScheduleOverlapsRange,
  gccCalendarDate,
  parseActivityLocalDateTime,
  resolveActivityScheduleEndFromFields,
  resolveActivityScheduleEndInstant,
  activityScheduleSpanLabel,
  type ActivityScheduleFields,
} from './activity-schedule.js';

export {
  activityScheduleIsMultiDay,
  formatActivityScheduleDateRangeLabel,
  formatActivityScheduleTimeRangeLabel,
} from './activity-schedule-presentation.js';

export type {
  AgentDiscoverEntityKind,
  AgentDiscoverItemDTO,
  AgentDiscoverPlaceKind,
  AgentDiscoverResponseDTO,
  AgentManifestDTO,
} from './agent-discover.js';

export {
  BWL_COLLECTIONS,
  BWL_RETIRED_SEEKING_COLLECTIONS,
  BWL_CATALOG_GEO_FIELDS,
  BWL_ACTIVITY_PERSON_FIELDS,
  BWL_JOIN_REQUEST_FIELDS,
  resolveHostNote,
  BWL_API_MOUNTS,
  BWL_EXPLORE_MAP_SOURCE,
  BWL_PEOPLE_SEGMENT,
  BWL_USER_ROLES,
  isFriendsPeopleSegment,
  normalizePeopleSegment,
} from './wire-lexicon.js';
export type { ActivityModeWire } from './wire-lexicon.js';

export {
  sniffHeicContainerBuffer,
  sniffHeicContainerBytes,
} from './heic-container.js';

export {
  RIDESHARE_DESTINATION_ACTIVITY_PREFIX,
  RIDESHARE_DESTINATION_PLACE_PREFIX,
  RIDESHARE_PENDING_DESTINATION_PLACE_PREFIX,
  rideshareDestinationActivityId,
  rideshareDestinationPlaceId,
  rideshareHasPendingDestinationPlace,
  type RideshareDestinationKind,
} from './rideshare-destination.js';

export {
  PENDING_VENUE_PLACE_PREFIX,
  activityHasPendingVenuePlace,
  pendingVenuePlaceId,
} from './pending-venue-place.js';

export type {
  GeoCountsDTO,
  GeoKind,
  GeoLevel,
  GeoMetaDoc,
  GeoNodeDoc,
  GeoNodeLite,
  GeoOutboxDoc,
  GeoPointWire,
  GeoRef,
  GeoRefNames,
  GeoStatsDoc,
  GeoSummaryDTO,
  GeoTreeDTO,
  DedupeKeys,
} from './geo-hierarchy.js';
export {
  GEO_COUNTRY_AE_ID,
  GEO_STATE_AE_ABU_DHABI_ID,
  GEO_AREA_AE_AL_AIN_ID,
  GEO_LEGACY_STATE_AE_AL_AIN_ID,
  GEO_LEGACY_AREA_OTHER_AL_AIN_ID,
  GEO_NODE_ID_ALIASES,
  canonicalGeoNodeId,
  buildGeoSearchTokens,
  exploreGeoQueryTokens,
  geoRefMatchesQuery,
  tokenizeGeoSearchText,
} from './geo-hierarchy.js';

export type { GeoCountedPin, GeoDelta } from './geo-counters.js';
export { countersFor, deltaFor, scopesFor } from './geo-counters.js';

export type {
  AdminSubmissionDTO,
  DedupeKind,
  DuplicateVerdict,
  SubmissionCandidate,
  SubmissionDoc,
  SubmissionPublicDTO,
  SubmissionStatus,
} from './dedupe.js';
export {
  buildDedupeKeys,
  cellsFor,
  domainKey,
  geohashEncode,
  nameKey,
  phoneKey,
  primaryGeohashPrecision,
  scoreDuplicate,
  trigramRatio,
} from './dedupe.js';

export type {
  CatalogEntryDoc,
  CatalogKind,
  FacilityType,
  HostType,
  PaymentDoc,
  VerificationDocumentDoc,
  VerificationDocumentType,
  VerificationState,
  VerificationStatus,
} from './detail-revamp-enums.js';
export {
  AMENITY_TYPES,
  COMMERCIAL_FACILITY_TYPES,
  DETAIL_ARRAY_CAPS,
  mapFacilityKindToPlanType,
} from './detail-revamp-enums.js';
