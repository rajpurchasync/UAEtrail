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
import type { ExploreActivityMode } from './explore-activity-mode.js';
import type { ActivityGroupChatPostPolicy } from './activity-group-chat-post-policy.js';
import type { PlaceNearbyFacilityDTO } from './place-kind.js';
import type { ExploreMapSourceWire } from './wire-lexicon.js';

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
  areaLabel?: string | null;
  /** Curated geographic area (`GET /areas/:slug`). */
  areaId?: string | null;
  /** Populated on place detail reads when `areaId` resolves to a published area. */
  areaSlug?: string | null;
  areaName?: string | null;
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

export interface LocationDetailResponse {
  data: LocationDTO;
  premium: LocationPremiumSummaryDTO | null;
  /** Facility POIs in the same curated area as `data` (when `data.areaId` is set). */
  nearbyFacilities?: PlaceNearbyFacilityDTO[];
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
  locationId: string;
  locationName: string;
  region?: string;
  groupRegionLevels?: GroupRegionLevels | null;
  areaId?: string | null;
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
  /** How this activity was published — drives public name + profile link on explore/list. */
  publishingProfileKind?: PublishingProfileKind;
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
  /** Map/Plan mode — `seeking` = Find post (M1 activity row); default hosted outings omit or `hosted`. */
  activityMode?: ExploreActivityMode | null;
  /** Correlation id for `/me/seeking-posts/:postId` when `activityMode: seeking`. */
  participantIntentId?: string | null;
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
  BuddyRelationshipDTO,
  BuddyRequestDTO,
  BuddyRequestStatus,
  BuddySummaryDTO,
  BuddyUserPreviewDTO,
} from './buddy-connection.js';

export type { NotificationKind, NotificationMeta } from './notification-meta.js';
import type { NotificationMeta } from './notification-meta.js';

export type { MemberFollowStateDTO, MemberFollowSummaryDTO } from './member-follow.js';
export type { EntityFollowCheckDTO, EntityFollowDTO, EntityFollowKind } from './entity-follow.js';
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
  MemberDiscoverySeekingRowDTO,
  MemberDiscoveryOnTripRowDTO,
  MemberDiscoveryRosterDTO,
} from './member-discovery-roster.js';
export type {
  BuddyActivityPresenceDTO,
  BuddyActivityPresenceRowDTO,
  ExploreActivityRefDTO,
} from './buddy-activity-presence.js';
export type {
  SocialPeopleDTO,
  SocialPeoplePreviewDTO,
  SocialPeoplePreviewPersonDTO,
  SocialPeopleSegment,
  SocialPeopleSegmentCanonical,
  SocialPeopleSegmentWire,
  SocialPeopleRelationship,
  SocialPersonBuddyRequestState,
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
  /** Member profile completion (DOB, gender, based-in) — required to **host/publish**. */
  profileComplete: boolean;
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
  canAccessPublishingWorkspace: boolean;
  applicationStatus: HostApplicationStatus;
  tenantId: string | null;
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

/** Domain aliases — organisation profile types (wire: `GET /me/status`). */
export type OrganisationApplicationStatus = HostApplicationStatus;
export type OrganisationProfileType = HostProfileType;
export type OwnedOrganisationProfileType = OwnedHostProfileType;
export type OwnedOrganisationProfileDTO = OwnedHostProfileDTO;
/** Publish/workspace slice of {@link MemberStatusDTO} — not a separate HTTP resource. */
export interface MemberPublishCapabilitiesDTO {
  canPublish: boolean;
  canAccessPublishingWorkspace: boolean;
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
  /** Blood group, medical conditions, emergency contact — required to join outings. */
  medicalSafetyProfileComplete: boolean;
  profileRoleLabel: MemberProfileRoleLabel;
  publish: MemberPublishCapabilitiesDTO;
};

export const buildMemberPublishCapabilities = (
  status: HostStatusDTO
): MemberPublishCapabilitiesDTO => ({
  canPublish: status.canPublish,
  canAccessPublishingWorkspace: status.canAccessPublishingWorkspace,
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
}

/** Domain alias — shop organisation. Storage/API remain `merchant_profiles` / `MerchantProfileDTO`. */
export type ShopOrganisationDTO = MerchantProfileDTO;

/** Public shop profile — same wire shape as {@link MerchantProfileDTO}. */
export type MerchantPublicDTO = MerchantProfileDTO;

/** Domain alias — public shop page payload. */
export type ShopPublicDTO = MerchantPublicDTO;

export type ExploreMapKind = ActivityType | 'shop' | 'agency' | 'area';
export type { ExploreMapSourceCanonical, ExploreMapSourceWire } from './wire-lexicon.js';
export type ExploreMapSource = ExploreMapSourceWire;

export type { ExploreAreaLensStatsDTO } from './explore-area-lens.js';
export { exploreAreaLensStatsSummary } from './explore-area-lens.js';

export type { ExploreActivityMode } from './explore-activity-mode.js';
export {
  exploreMapItemIsHostedActivity,
  exploreMapItemIsSeeking,
  isTimeBoundExploreMapItem,
  resolveExploreMapActivityMode,
} from './explore-activity-mode.js';

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
  /** @deprecated Use `featuredPerson` — kept for cached explore payloads during migration. */
  hostName?: string | null;
  /** @deprecated Use `featuredPerson.avatarUrl` */
  hostAvatar?: string | null;
  date?: string | null;
  time?: string | null;
  slotsAvailable?: number;
  slotsTotal?: number;
  participantPreviews?: ParticipantPreviewDTO[];
  image?: string | null;
  activity?: ActivityDTO;
  rideshareEnabled?: boolean;
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
  /** @deprecated Use `featuredPerson.userId`. */
  requesterUserId?: string | null;
  /** Leftover intent id on seeking rows that still dual-wrote `participant_intents`. */
  participantIntentId?: string | null;
  /**
   * Time-bound map mode — `hosted` for published outings; `seeking` for Find crew posts.
   */
  activityMode?: 'hosted' | 'seeking' | null;
  /** Curated area membership for explore `?area=` filters. */
  areaId?: string | null;
  areaSlug?: string | null;
  /** Published curated area hub title when `areaId` is set. */
  areaName?: string | null;
  groupRegionLevels?: GroupRegionLevels | null;
  /** Set when a host converts this request into a published activity. */
  convertedActivityId?: string | null;
  /** Shop/agency about one-liner for map cards. */
  about?: string | null;
  /** Trail/camp/event catalog fields for rich location list cards. */
  locationCard?: ExploreLocationCardDTO | null;
  /** Canonical catalog kind when wire `kind` alone is ambiguous (`event` amenities). */
  placeKind?: import('./place-kind.js').PlaceKind | null;
  /** Contributed catalog shop — `peek` (map only) vs merchant `full` profile. */
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
  /** Buddy/activities browse family. Null for venue/shop. */
  outingCategory?: OutingCategory | null;
  /** Optional subtype within `outingCategory` (derive-on-read until E5 persistence). */
  outingTopic?: OutingTopic | null;
  /** Join mode for published hosted outings only. */
  participationMode?: ParticipationMode | null;
  /** Rideshare activities linked to this parent plan (parent rows only). */
  linkedRideshareActivities?: ExploreLinkedRideshareDTO[];
  /** Area hub rollups (place/facility counts). Not a map pin — Area is an admin-curated name. */
  areaLensStats?: import('./explore-area-lens.js').ExploreAreaLensStatsDTO | null;
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
  | 'platform_admin'
  /** @deprecated Use business_host */
  | 'business_organizer'
  /** @deprecated Use guide_host */
  | 'guide_organizer'
  /** @deprecated Use host_staff */
  | 'organizer_staff';

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
}

export interface OrganisationHostDetailsDTO {
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

/** Public organisation profile — wire shape for `GET /tenants/:slug`. */
export interface TenantPublicDTO {
  id: string;
  name: string;
  slug: string;
  type: TenantType | string;
  businessMode?: string | null;
  description?: string | null;
  website?: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string | null;
  ownerBio: string | null;
  hostDetails?: OrganisationHostDetailsDTO;
  /** @deprecated Use hostDetails — kept for legacy clients. */
  organizerDetails?: OrganisationHostDetailsDTO;
  memberCount: number;
  team: TenantPublicTeamMemberDTO[];
  activities: ActivityDTO[];
  /** Preferred shop public id when tenant is a shop. Wire: merchant_profiles._id */
  shopId?: string | null;
  /** @deprecated Use shopId */
  merchantId?: string | null;
}

// ─── Member medical safety (join / host roster) ─────────────────────────────

export {
  BLOOD_GROUP_VALUES,
  MEDICAL_CONDITIONS_NA,
  formatBloodGroupLabel,
  isMedicalSafetyProfileComplete,
  toMemberMedicalSafetyDto,
} from './member-medical-safety.js';
export type {
  BloodGroup,
  MemberMedicalSafetyDTO,
  MemberMedicalSafetyFields,
} from './member-medical-safety.js';

// ─── Participant DTO ────────────────────────────────────────────────────────

export type { HostParticipantRosterStatus, ParticipantHostRatingDTO } from './participant-roster.js';
export type {
  RideshareRiderRatingDimensionsDTO,
  RideshareRiderReputationDTO,
} from './rideshare-rider-reputation.js';
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
  ORGANIZER_FALLBACK_DISPLAY_NAME,
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
  exploreActivityPublisherTypeLabel,
  publishesActivityAsIndividual,
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
  buildExploreWhenSegment,
  exploreHeadline,
  explorePrimaryCtaLabel,
  exploreSecondaryCtaLabel,
  exploreSpotsLabel,
  exploreSubtitle,
  exploreVenueHint,
  formatExploreDayForHeadline,
  formatExploreDayShort,
  formatExploreRelativeScheduleLabel,
  formatExploreTime,
  formatSeekingTitlePhrase,
  resolveExploreItemSource,
  resolveMapPinItemSource,
  resolveMapPinEmoji,
  CATALOG_PLACE_MAP_SOURCE,
  FACILITY_MAP_SOURCE,
  PLACE_MAP_SOURCE,
  isCatalogPlaceMapSource,
  isFacilityMapSource,
  isGeographyMapSource,
  isPlaceMapSource,
  normalizeExploreMapSource,
  sanitizeExploreLocation,
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
  exploreSeekingMapItemPath,
  resolveSeekingExploreMapItemId,
  exploreMapKindToPlanMapKind,
  canonicalizeMapComposeIntent,
  exploreMapSourceToComposeIntent,
  outingCategoryToHostCreateKind,
  participantIntentKindToOutingCategory,
  resolveActivityOutingTopic,
  resolveHostCreateKindFromSeekingMapItem,
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
  resolvePlaceDisplayTitle,
  resolveVenueExploreLabels,
} from './venue-catalog-tags.js';

export {
  extractJoinInstructionLines,
  extractNonJoinRequirements,
  hasJoinInstructions,
  JOIN_INSTRUCTION_PREFIX,
} from './join-instructions.js';

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
  activityViewerLevelCanAccessCrewSurfaces,
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
  computeProfileDetailExposure,
  type ProfileDetailExposure,
  type ProfileVisibilitySetting,
  type ProfileViewerAccessDTO,
  type ProfileViewerAccessLevel,
} from './profile-viewer-access.js';

export {
  type BusinessProSubtype,
  type ProMembershipPath,
  type PublishingProfileKind,
  isActivityPublishingProfileType,
  resolvePublishingProfileKind,
  inferHostStorefrontKindFromTenantWire,
} from './publishing-profile-kind.js';

export {
  resolveCommerceMapViewerAccess,
  resolvePublicPlaceMapViewerAccess,
} from './catalog-viewer-access.js';

export {
  memberAudienceMayAttemptHostPublish,
  memberHasHostFootprintBadge,
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
  APPROVAL_PARTICIPATION_REQUIREMENT,
  RSVP_PARTICIPATION_REQUIREMENT,
  activityJoinCtaLabel,
  inferParticipationModeFromRequirements,
  resolveParticipationMode,
  resolveParticipationModeForJoinMode,
  type ParticipationMode,
} from './activity-participation-mode.js';

export {
  resolveActivityJoinEngagementKind,
  type ActivityJoinEngagementKind,
} from './activity-join-engagement.js';

export {
  ACTIVITY_DETAIL_TAB_IDS,
  resolveActivityDetailTabFooterKind,
  type ActivityDetailTabFooterInput,
  type ActivityDetailTabFooterKind,
  type ActivityDetailTabId,
} from './activity-detail-tab-footers.js';

export {
  buildActivityPresentationDTO,
  type ActivityPresentationBuddiesTabDTO,
  type ActivityPresentationConsumerLayoutDTO,
  type ActivityPresentationDTO,
  type ActivityPresentationEngagementDTO,
  type ActivityPresentationPlaceTabDTO,
  type ActivityPresentationPlanTabDTO,
  type ActivityPresentationTabsDTO,
  type ActivityPresentationTransportTabDTO,
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
} from './member-availability.js';
export type { MemberAvailabilityDayBlock } from './member-availability.js';
export type {
  AvailabilityKind,
  AvailabilityTimeBand,
  AvailabilityVisibility,
  ExploreAvailabilityClusterDTO,
  ExploreAvailablePersonDTO,
  MemberAvailabilityDTO,
  MemberAvailabilityPublicDTO,
  MemberAvailabilityMatchPreviewDTO,
  MemberAvailabilitySlotDTO,
  UpsertMemberAvailabilityInput,
} from './member-availability.js';

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
  OutdoorMapEntryCategory,
  OutdoorMapEntryDTO,
  OutdoorMapFilterCategory,
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
  normalizeGroupRegionLabel,
  resolveGroupRegionFromCoordinates,
  resolveGroupRegionLabel,
  stampGroupRegionLevelsFromGeo,
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
  deriveActivityAvailability,
  isActivityFull,
  type ActivityAvailabilityInput,
  type ActivityAvailabilityStatus,
  type ActivityJoinCountInput,
} from './activity-availability.js';

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
  memberDiscoverProfilePath,
  memberProfilePath,
  type MemberProfileBrowseLens,
  type MemberProfilePathOptions,
  normalizePlaceActivityType,
  organisationProfilePath,
  partnerProfilePath,
  parseEntityRefFromPathname,
  placeDetailPath,
  canonicalPlaceDetailPath,
  inboundKindPlaceDetailPath,
  PLACE_CANONICAL_PATH_PREFIX,
  facilityDetailPath,
  resolveEntityPath,
  resolveOrganisationProfilePath,
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

export { FACILITY_KINDS, isFacilityKind, type FacilityKind } from './facility-kind.js';

export type { FacilityDTO } from './facility.js';

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
  HOST_COMPOSE_KINDS,
  SEEKING_COMPOSE_KINDS,
  ADD_PLACE_KINDS,
  type ComposeMenuIntent,
  type AddPlaceKind,
  type AddTarget,
  type ExploreComposeWire,
  type HostComposeKind,
  type SeekingComposeKind,
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

export type {
  AreaBoundsRing,
  AreaCenter,
  AreaDTO,
  AreaPublicDTO,
  AreaStatus,
} from './area.js';
export {
  approximateAreaBoundsKm2,
  areaDetailPath,
  exploreAreaQueryParam,
  pointInAreaBounds,
} from './area.js';

export {
  CURATED_AREA_SEED_IDS,
  CURATED_AREA_SEED_SLUGS,
  curatedAreaSeedId,
  type CuratedAreaSeedKey,
} from './curated-area-seeds.js';

export {
  CURATED_AREA_CATALOG,
  CURATED_AREA_CATALOG_BY_KEY,
  CURATED_AREA_CATALOG_BY_SLUG,
  listCuratedAreaSeedKeys,
  type CuratedAreaCatalogEntry,
  type CuratedAreaBBox,
} from './curated-area-catalog.js';

export type { MemberInboxGroupDTO, MemberInboxGroupType } from './member-inbox.js';

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
  parseActivityLocalDateTime,
  resolveActivityScheduleEndFromFields,
  resolveActivityScheduleEndInstant,
  type ActivityScheduleFields,
} from './activity-schedule.js';

export type {
  AgentDiscoverEntityKind,
  AgentDiscoverItemDTO,
  AgentDiscoverPlaceKind,
  AgentDiscoverResponseDTO,
  AgentManifestDTO,
} from './agent-discover.js';

export {
  BWL_COLLECTIONS,
  BWL_ACTIVITY_PERSON_FIELDS,
  BWL_JOIN_REQUEST_FIELDS,
  resolveHostNote,
  BWL_API_MOUNTS,
  BWL_EXPLORE_MAP_SOURCE,
  BWL_PEOPLE_SEGMENT,
  BWL_USER_ROLES,
  isBuddyPeopleSegment,
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
