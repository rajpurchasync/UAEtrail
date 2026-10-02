import type { GroupWallReplyPreviewDTO } from './group-wall.js';
import type { ExploreCardPresentationDTO } from './explore-presentation.js';
import type { ExploreMapPersonDTO } from './explore-person.js';
import type { ActivityJoinMode } from './activity-join-mode.js';
import type { ParticipationMode } from './activity-participation-mode.js';
import type {
  ExplorePlanComposeIntent,
  OutingCategory,
  OutingTopic,
} from './explore-plan-projection.js';

export type UserRole =
  | 'platform_admin'
  | 'merchant_admin'
  | 'tenant_owner'
  | 'tenant_admin'
  | 'tenant_guide'
  | 'participant';

export type TenantType = 'company' | 'guide_owned';
export type MembershipRole = 'tenant_owner' | 'tenant_admin' | 'tenant_guide';

/** Scheduled listings on the map (host activities, carpools). */
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
  emirate?: string | null;
  premiumImages?: string[];
  accessibleBy?: string[];
  viewCount?: number;
  countryCode?: string;
  submittedById?: string | null;
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

export interface ActivityPricePackageDTO {
  label: string;
  amount: number;
  currency: string;
}

export interface ActivityDTO {
  id: string;
  tenantId: string;
  tenantSlug: string;
  locationId: string;
  locationName: string;
  region?: string;
  activityType: ScheduledActivityType;
  title: string;
  description: string;
  date: string;
  time: string;
  endDate?: string | null;
  endTime?: string | null;
  price: number;
  pricePackages?: ActivityPricePackageDTO[];
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
  linkedActivityId?: string | null;
  linkedRideshareActivityId?: string | null;
  linkedRideshare?: ActivityDTO | null;
  linkedParentActivity?: Pick<ActivityDTO, 'id' | 'title' | 'activityType'> | null;
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
  /** External registration or join link */
  signupUrl?: string | null;
  /** Person responsible for hosting this activity on the ground */
  hostName?: string;
  hostUserId?: string;
  hostAvatar?: string;
  hostBio?: string | null;
  /** Organization or guide brand running the activity */
  tenantName?: string;
  /** @deprecated Removed from API responses — use hostName */
  organizerName?: string;
  /** @deprecated Removed from API responses — use hostAvatar */
  organizerAvatar?: string;
  /** @deprecated Removed from API responses — use hostUserId */
  organizerUserId?: string;
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
}


export interface ActivityDetailDTO extends ActivityDTO {
  visibilityState?: 'full' | 'private';
  message?: string;
  organizerId?: string;
  participants?: ParticipantPreviewDTO[];
  location?: LocationDTO;
  myParticipation?: ActivityParticipationDTO | null;
  myRequest?: MyActivityRequestDTO | null;
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
  organizerNote?: string | null;
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
export type { MemberHubStatsDTO } from './member-hub-stats.js';
export type {
  HostPublishingTier,
  HostTierFlags,
  MemberProfileRoleLabel,
} from './host-publishing-tier.js';
import type { HostTierFlags, MemberProfileRoleLabel } from './host-publishing-tier.js';

export type HostApplicationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type HostProfileType = 'individual' | 'agency' | 'shop';

export type TenantBusinessMode = 'agency' | 'shop';

export type OwnedHostProfileType = 'guide' | 'agency' | 'shop';

export interface OwnedHostProfileDTO {
  type: OwnedHostProfileType;
  tenantId: string;
  name: string;
  slug: string;
}

/**
 * Member publishing + host console eligibility (`GET /me/host-status`).
 * Single wire contract — clients must not re-derive tiers from `UserRole` alone.
 */
export interface HostStatusDTO {
  /** Member profile completion (DOB, gender, based-in) — required before buddy Organize. */
  signupProfileComplete: boolean;
  /** First map publish (activity or demand) — earns Host badge. */
  isCommunityHost: boolean;
  /** Active tiers for this account (see `docs/MEMBER_MODEL.md`). */
  hostTiers: HostTierFlags;
  /** Canonical profile subtitle key — map with `memberProfileRoleLabel()`. */
  profileRoleLabel: MemberProfileRoleLabel;
  /** Can post Organize activities (community / pro / business tenant). */
  canPublish: boolean;
  /** `/host/*` console (publish queue, team) when publish-capable or business member. */
  canAccessHostConsole: boolean;
  applicationStatus: HostApplicationStatus;
  tenantId: string | null;
  isHostRole: boolean;
  hasTenant: boolean;
  tenantType: TenantType | null;
  businessMode: TenantBusinessMode | null;
  /** Licensed agencies only — paid commercial activities. */
  canHostPaidActivities: boolean;
  hasGuideProfile: boolean;
  hasAgencyProfile: boolean;
  hasShopProfile: boolean;
  ownedProfiles: OwnedHostProfileDTO[];
}

/** Domain aliases — organisation console status (wire: `/me/host-status`). */
export type OrganisationApplicationStatus = HostApplicationStatus;
export type OrganisationProfileType = HostProfileType;
export type OwnedOrganisationProfileType = OwnedHostProfileType;
export type OwnedOrganisationProfileDTO = OwnedHostProfileDTO;
export type OrganisationConsoleStatusDTO = HostStatusDTO;

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
}

// ─── Shop DTOs ──────────────────────────────────────────────────────────────

export type ProductStatusType = 'draft' | 'active' | 'inactive';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'paid'
  | 'cancelled'
  | 'refunded';

export interface ProductDTO {
  id: string;
  name: string;
  description?: string;
  images: string[];
  priceAed: number;
  stockQuantity: number;
  lowStockThreshold: number;
  discountPercent?: number;
  memberDiscountPercent?: number;
  externalUrl?: string | null;
  packagingInfo?: string;
  category: string;
  status: ProductStatusType;
  merchantId: string;
  merchantName: string;
  latitude?: number | null;
  longitude?: number | null;
  region?: string | null;
}

export type ReviewTargetType = 'location' | 'tenant';

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

export type PostCategory = 'questions' | 'activity-reports' | 'photos' | 'tips';

export interface PostReplyDTO {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorMembershipTier?: MembershipTierDTO | null;
  content: string;
  likedByMe: boolean;
  likeCount: number;
  isAccepted: boolean;
  createdAt: string;
}

export interface PostDTO {
  id: string;
  category: PostCategory;
  title: string;
  content: string;
  excerpt: string;
  images: string[];
  locationId?: string | null;
  locationName?: string | null;
  activityId?: string | null;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorMembershipTier?: MembershipTierDTO | null;
  likedByMe: boolean;
  likeCount: number;
  replyCount: number;
  acceptedReplyId?: string | null;
  replies: PostReplyDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteDTO {
  id: string;
  locationId?: string | null;
  activityId?: string | null;
  participantIntentId?: string | null;
  alertOnMatch?: boolean;
  watchOutingCategory?: OutingCategory | null;
  watchLatitude?: number | null;
  watchLongitude?: number | null;
  productId?: string | null;
  merchantId?: string | null;
  tenantId?: string | null;
  profileUserId?: string | null;
  location?: { id: string; name: string; images: string[] } | null;
  /** @deprecated Prefer `activity` — API returns `activity`. */
  event?: { id: string; title: string; locationName: string | null } | null;
  activity?: { id: string; title: string; locationName: string | null } | null;
  participantIntent?: { id: string; title: string } | null;
  merchant?: { id: string; shopName: string; logo?: string | null } | null;
  tenant?: { id: string; name: string; logoUrl?: string | null; slug?: string | null } | null;
  profile?: { id: string; displayName: string; avatarUrl?: string | null } | null;
  product?: {
    id: string;
    merchantId: string;
    merchantName: string | null;
    name: string;
    images: string[];
    priceAed: number;
    discountPercent?: number | null;
    category: string;
  } | null;
  createdAt: string;
}

export type ShopPresence = 'physical' | 'online';

export interface MerchantProfileDTO {
  id: string;
  /** Preferred commerce profile id (`merchant_profiles._id`). Same as `id`. */
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

export interface MerchantPublicDTO extends MerchantProfileDTO {
  products: ProductDTO[];
}

/** Domain alias — public shop page payload. Storage/API remain `merchant_profiles` / `/shop/merchants/:id`. */
export type ShopPublicDTO = MerchantPublicDTO;

export type ExploreMapKind = ActivityType | 'shop' | 'agency';
export type ExploreMapSource = 'activity' | 'venue' | 'shop' | 'agency' | 'demand';

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
  productId?: string;
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
  /** @deprecated Use `featuredPerson.userId` for demand items. */
  requesterUserId?: string | null;
  /** Demand request id (without demand: prefix). */
  participantIntentId?: string | null;
  /** Set when a host converts this request into a published activity. */
  convertedActivityId?: string | null;
  /** Shop/agency about one-liner for map cards. */
  about?: string | null;
  /** Trail/camp/event catalog fields for rich location list cards. */
  locationCard?: ExploreLocationCardDTO | null;
  /** Aggregate review stats for venues (location) and shops/agencies (tenant). */
  averageRating?: number | null;
  reviewCount?: number;
  /** Server-built headlines, list titles, and card sections for explore UI. */
  presentation?: ExploreCardPresentationDTO;
  /** Tenant id when the map item represents a shop profile. */
  tenantId?: string | null;
  /** Gear shop map presence — physical stores get pins; online partners are list-only. */
  shopPresence?: ShopPresence | null;
  /** Plan browse projection (organize vs demand). Null for venue/shop catalog rows. */
  composeIntent?: ExplorePlanComposeIntent | null;
  /** Buddy/activities browse family. Null for venue/shop. */
  outingCategory?: OutingCategory | null;
  /** Optional subtype within `outingCategory` (derive-on-read until E5 persistence). */
  outingTopic?: OutingTopic | null;
  /** Join mode for published organize plans only. */
  participationMode?: ParticipationMode | null;
  /** Rideshare activities linked to this parent plan (parent rows only). */
  linkedRideshareActivities?: ExploreLinkedRideshareDTO[];
}

export interface ProductClick {
  id: string;
  productId: string;
  timestamp: string;
  userId: string;
}

export interface OrderLineItem {
  id: string;
  productId: string;
  quantity: number;
  totalAed: number;
  status: OrderStatus;
  fulfillmentTrackingLink?: string | null;
  timestamp: string;
}

export interface MerchantOrderLineItemDTO extends OrderLineItem {
  orderId: string;
  product: {
    id: string;
    name: string;
    images: string[];
    priceAed: number;
    merchantId: string;
    stockQuantity: number;
    lowStockThreshold: number;
  };
}

export type MerchantAnalyticsInterval = 'day' | 'month' | 'year';

export interface MerchantAnalyticsPointDTO {
  bucket: string;
  salesAed: number;
  clicks: number;
  orderCount: number;
  quantitySold: number;
}

export interface MerchantAnalyticsSeriesDTO {
  merchantId?: string;
  merchantIds: string[];
  startDate: string;
  endDate: string;
  interval: MerchantAnalyticsInterval;
  points: MerchantAnalyticsPointDTO[];
}

/** Domain aliases — shop organisation analytics (wire remains `MerchantAnalytics*`). */
export type ShopAnalyticsInterval = MerchantAnalyticsInterval;
export type ShopAnalyticsPointDTO = MerchantAnalyticsPointDTO;
export type ShopAnalyticsSeriesDTO = MerchantAnalyticsSeriesDTO;

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

export interface TenantPublicProductDTO {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  priceAed: number;
  discountPercent: number | null;
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
  shopProducts?: TenantPublicProductDTO[];
}

// ─── Participant DTO ────────────────────────────────────────────────────────

export interface ParticipantDTO {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  checkedInAt?: string;
  joinedAt: string;
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
  demandFallbackTitle,
  isGenericDemandPlanTitle,
  isLegacyEmbeddedDemandTitle,
  normalizeLegacyDemandTitle,
  type DemandTitleKind,
} from './demand-titles.js';

export {
  buildExploreFeaturedPerson,
  explorePersonFirstName,
  explorePersonRoleLabel,
  formatExplorePersonDisplayName,
  resolveExploreFeaturedPerson,
  type ExploreFeaturedPersonInput,
  type ExploreMapPersonDTO,
  type ExploreMapPersonRole,
} from './explore-person.js';

export {
  ROLE_PLACEHOLDER_DISPLAY_NAME,
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
  HIKING_ACTIVITY_EMOJI,
  HIKING_VENUE_EMOJI,
  CAMPING_ACTIVITY_EMOJI,
  CAMPING_VENUE_EMOJI,
  DEMAND_EMOJI,
  EXPLORE_PLACES_LAYER_EMOJI,
  UAE_FLAG_EMOJI,
  RIDESHARE_EMOJI,
  SHOP_MAP_EMOJI,
  MAP_FILTER_EMOJI,
  MAP_LAYER_FILTER_EMOJI,
  buildExploreCardPresentation,
  buildExploreCardSections,
  buildExploreListWhen,
  buildExploreRouteLabel,
  buildExploreSpotsSegment,
  buildExploreWhenSegment,
  exploreHeadline,
  explorePrimaryCtaLabel,
  exploreSecondaryCtaLabel,
  exploreSpotsLabel,
  exploreSubtitle,
  exploreVenueHint,
  formatExploreDayForHeadline,
  formatExploreDayShort,
  formatExploreTime,
  formatPlanPhrase,
  resolveExploreItemSource,
  resolveMapPinItemSource,
  resolveMapPinEmoji,
  sanitizeExploreLocation,
  type ExploreCardDetail,
  type ExploreCardDetailIcon,
  type ExploreCardKind,
  type ExploreCardPresentationDTO,
  type ExploreCardSections,
  type ExploreCardSource,
} from './explore-presentation.js';

export {
  activityOrganizeTopicToOutingTopic,
  activityTypeToOutingCategory,
  buildExploreMapPlanProjection,
  deriveOutingTopicFromRequirements,
  exploreDemandMapItemPath,
  exploreMapKindToPlanMapKind,
  exploreMapSourceToComposeIntent,
  outingCategoryToOrganizeCreateKind,
  participantIntentKindToOutingCategory,
  resolveActivityOutingTopic,
  resolveOrganizeCreateKindFromDemandMapItem,
  type ExploreMapKindForPlan,
  type ExploreMapPlanActivityKind,
  type ExploreMapPlanProjection,
  type ExploreMapPlanSource,
  type ExplorePlanComposeIntent,
  type OrganizeCreateKindWire,
  type OutingCategory,
  type OutingTopic,
  type ParticipantIntentKindForPlan,
} from './explore-plan-projection.js';

export {
  VENUE_NAME_AR_TAG_PREFIX,
  VENUE_NAME_EN_TAG_PREFIX,
  readVenueArabicNameFromTags,
  readVenueEnglishNameFromTags,
  resolvePlaceDisplayTitle,
  resolveVenueExploreLabels,
} from './venue-catalog-tags.js';

export {
  extractJoinInstructionLines,
  extractNonJoinRequirements,
  hasActivityJoinInstructions,
  hasJoinInstructions,
  JOIN_INSTRUCTION_PREFIX,
} from './join-instructions.js';

export {
  inferJoinModeFromRequirements,
  PRIVATE_JOIN_REQUIREMENT_PREFIX,
  type ActivityJoinMode,
} from './activity-join-mode.js';

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
  isWomenOnlyActivityRequirements,
  resolveWomenOnlyJoinEligibility,
  womenOnlyJoinBlockMessage,
  type UserGenderWire,
  type WomenOnlyJoinEligibility,
} from './activity-audience-requirements.js';

export type {
  MemberGoalActivityFilter,
  MemberGoalDTO,
  MemberGoalPublicDTO,
  UpsertMemberGoalInput,
} from './member-goals.js';

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
  ACTIVITY_CURRENCIES,
  activityHasPaidPricing,
  activityPriceLabel,
  activityPricingModeLabel,
  derivePriceAed,
  eventHasPaidPricing,
  formatPackagePrice,
  inferActivityPricingMode,
  isActivityPricePackage,
  normalizeActivityPricing,
  parseStoredPricePackages,
  type ActivityCurrency,
  type ActivityPricePackage,
  type ActivityPricingInput,
  type ActivityPricingMode,
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
  memberProfilePath,
  normalizePlaceActivityType,
  organisationProfilePath,
  parseEntityRefFromPathname,
  placeDetailPath,
  resolveEntityPath,
  resolveOrganisationProfilePath,
  shopPublicPath,
  type EntityKind,
  type EntityRef,
  type PlaceVenueKind,
  type ResolveEntityPathOptions,
} from './entity-path.js';

export {
  PLACE_KINDS,
  PLACE_KIND_LABELS,
  PLACE_STORAGE_COLLECTION,
  isLocationActivityTypeWire,
  isPlaceKind,
  locationActivityTypeForPlaceKind,
  placeDetailRouteKindFromPlaceKind,
  placeKindFromContributeVenueKind,
  placeKindFromLocationRow,
  tagsForPlaceKind,
  type LocationActivityTypeWire,
  type PlaceDetailRouteKind,
  type PlaceKind,
} from './place-kind.js';

export {
  COMMUNITY_SHOP_TAG,
  decodeShopContributeTags,
  encodeShopContributeTags,
  type DecodedShopContributeTags,
  type ShopContributeTagInput,
} from './shop-contribute.js';

export type {
  GroupWallMessageAuthorDTO,
  GroupWallPostPolicy,
  GroupWallReplyPreviewDTO,
  GroupWallStreamEventDTO,
  GroupWallStreamMessageDTO,
  SocialGroupChatPreviewDTO,
} from './group-wall.js';

export { groupWallBodySnippet } from './group-wall.js';

export type { MemberInboxGroupDTO, MemberInboxGroupType } from './member-inbox.js';

export interface MemberInboxDTO {
  direct: ChatConversationDTO[];
  groups: import('./member-inbox.js').MemberInboxGroupDTO[];
}
