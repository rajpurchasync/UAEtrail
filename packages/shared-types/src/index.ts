export type UserRole =
  | 'platform_admin'
  | 'merchant_admin'
  | 'tenant_owner'
  | 'tenant_admin'
  | 'tenant_guide'
  | 'participant';

export type TenantType = 'company' | 'guide_owned';
export type MembershipRole = 'tenant_owner' | 'tenant_admin' | 'tenant_guide';

export type ActivityType = 'hiking' | 'camping' | 'event' | 'carpool';
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

export interface LocationDTO {
  id: string;
  name: string;
  region: string;
  activityType: ActivityType;
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
  activityType: ActivityType;
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
  carPoolEnabled?: boolean;
  carPoolFree?: boolean | null;
  carPoolPriceAed?: number | null;
  carPoolSeats?: number | null;
  carPoolDetails?: string | null;
  linkedActivityId?: string | null;
  linkedCarpoolActivityId?: string | null;
  linkedCarpool?: ActivityDTO | null;
  linkedParentActivity?: Pick<ActivityDTO, 'id' | 'title' | 'activityType'> | null;
  paymentTerms?: string | null;
  pricingMode?: 'free' | 'shared' | 'paid' | null;
  itinerary?: string[] | null;
  requirements?: string[] | null;
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
  /** @deprecated Use hostName — kept for compatibility */
  organizerName?: string;
  organizerAvatar?: string;
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
}


export interface ActivityDetailDTO extends ActivityDTO {
  organizerId?: string;
  participants: ParticipantPreviewDTO[];
  location: LocationDTO;
  myParticipation?: TripParticipationDTO | null;
  myRequest?: MyTripRequestDTO | null;
}

export interface MyActivityDTO extends ActivityDTO {
  participation: ActivityParticipationDTO;
}

/** @deprecated Use MyActivityDTO */
export type MyTripDTO = MyActivityDTO;

export interface ActivityParticipationDTO {
  participantId: string;
  requestId: string;
  status: 'confirmed';
  checkedInAt?: string | null;
  canCheckIn: boolean;
  checkInOpensAt?: string;
  checkInClosesAt?: string;
}

/** @deprecated Use ActivityParticipationDTO */
export type TripParticipationDTO = ActivityParticipationDTO;

export interface MyActivityRequestDTO {
  id: string;
  status: RequestStatus;
  canWithdraw: boolean;
}

/** @deprecated Use MyActivityRequestDTO */
export type MyTripRequestDTO = MyActivityRequestDTO;

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

/** Host publish eligibility for mobile create gate (Phase P3). */
export interface HostStatusDTO {
  /** Can post dated activities (guide or agency profile — not shop-only). */
  canPublish: boolean;
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

/** Predefined reasons when a user withdraws from a trip */
export const WITHDRAW_REASONS = [
  { value: 'schedule_conflict', label: 'Schedule conflict' },
  { value: 'cant_attend', label: "Can't make it anymore" },
  { value: 'found_other', label: 'Found another trip' },
  { value: 'health', label: 'Health or personal reasons' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'other', label: 'Other' }
] as const;

export type WithdrawReason = (typeof WITHDRAW_REASONS)[number]['value'];

export const withdrawReasonLabel = (value: string): string =>
  WITHDRAW_REASONS.find((r) => r.value === value)?.label ?? value;

export interface NotificationDTO {
  id: string;
  title: string;
  body: string;
  type: 'request_update' | 'system' | 'activity' | 'review_prompt';
  isRead: boolean;
  meta?: Record<string, unknown> | null;
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
  readAt?: string;
  createdAt: string;
}

// ─── Shop DTOs ──────────────────────────────────────────────────────────────

export type ProductStatusType = 'draft' | 'active' | 'inactive';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

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

export type PostCategory = 'questions' | 'trip-reports' | 'photos' | 'tips';

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
  productId?: string | null;
  location?: { id: string; name: string; images: string[] } | null;
  event?: { id: string; title: string; locationName: string | null } | null;
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

export interface MerchantProfileDTO {
  id: string;
  shopName: string;
  description?: string;
  logo?: string;
  contactEmail?: string;
  contactPhone?: string;
  latitude?: number | null;
  longitude?: number | null;
  region?: string | null;
  contactPersonName?: string | null;
  contactPersonAvatar?: string | null;
}

export interface MerchantPublicDTO extends MerchantProfileDTO {
  products: ProductDTO[];
}

export type ExploreMapKind = ActivityType | 'shop' | 'agency';
export type ExploreMapSource = 'activity' | 'venue' | 'shop' | 'agency' | 'demand';

export type ParticipantIntentKind = 'hiking' | 'camping' | 'event' | 'guide' | 'carpool' | 'other';

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
  createdAt: string;
  requesterName?: string | null;
  requesterAvatar?: string | null;
}

export type ExplorePriceLabelKind = 'free' | 'paid' | 'shared';

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
  hostName?: string | null;
  hostAvatar?: string | null;
  date?: string | null;
  time?: string | null;
  slotsAvailable?: number;
  slotsTotal?: number;
  participantPreviews?: ParticipantPreviewDTO[];
  image?: string | null;
  activity?: ActivityDTO;
  carPoolEnabled?: boolean;
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
  /** Demand requester user id — for message / respond actions. */
  requesterUserId?: string | null;
  /** Shop/agency about one-liner for map cards. */
  about?: string | null;
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
