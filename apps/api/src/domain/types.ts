/**
 * Entity types mirroring Prisma models (scalar fields only).
 * Use instead of `@prisma/client` model types in store layers.
 */

import type {
  Accessibility,
  ActivityType,
  AuthProvider,
  Difficulty,
  ActivityStatus,
  LocationStatus,
  LocationUnlockSource,
  MembershipRole,
  MembershipTier,
  NotificationType,
  OrderStatus,
  HostApplicationStatus,
  PostCategory,
  ProductStatus,
  RequestStatus,
  ReviewTargetType,
  RewardAction,
  TenantStatus,
  TenantBusinessMode,
  TenantType,
  UserRole,
  UserStatus
} from './enums.js';

interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  authProvider: AuthProvider;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  referralCode: string;
  referredById: string | null;
}

interface Profile {
  id: string;
  userId: string;
  displayName: string | null;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  rewardPoints: number;
  membershipTier: MembershipTier;
}

interface RewardLedger {
  id: string;
  userId: string;
  action: RewardAction;
  points: number;
  referenceId: string;
  label: string | null;
  meta: unknown | null;
  createdAt: Date;
}

interface UserBadge {
  id: string;
  userId: string;
  badgeKey: string;
  earnedAt: Date;
}

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

interface HostApplication {
  id: string;
  applicantId: string;
  requestedTenantId: string | null;
  requestedName: string;
  requestedSlug: string;
  requestedType: TenantType;
  status: HostApplicationStatus;
  reviewerId: string | null;
  reviewerNote: string | null;
  reviewedAt: Date | null;
  metadata: unknown | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  name: string;
  region: string;
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
  emirate: string | null;
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
  createdAt: Date;
  updatedAt: Date;
}

interface LocationUnlock {
  id: string;
  userId: string;
  locationId: string;
  source: LocationUnlockSource;
  createdAt: Date;
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
  carPoolEnabled: boolean;
  carPoolFree: boolean | null;
  carPoolPriceAed: number | null;
  carPoolSeats: number | null;
  carPoolDetails: string | null;
  /** Parent hike/camp/event when this is a linked carpool listing. */
  linkedActivityId: string | null;
  /** Linked carpool activity id when car pool is offered for this listing. */
  linkedCarpoolActivityId: string | null;
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
  status: ActivityStatus;
  featured: boolean;
  publishedAt: Date | null;
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
  organizerNote: string | null;
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

interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  meta: unknown | null;
  createdAt: Date;
}

interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  tenantId: string | null;
  metadata: unknown | null;
  createdAt: Date;
}

interface EmailVerificationToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

interface StripeWebhookEvent {
  id: string;
  processedAt: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  activityId: string | null;
  content: string;
  readAt: Date | null;
  createdAt: Date;
}

export interface MerchantProfile {
  id: string;
  adminIds: string[];
  shopName: string;
  description: string | null;
  logo: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description: string | null;
  images: string[];
  priceAed: number;
  stockQuantity: number;
  lowStockThreshold: number;
  discountPercent: number | null;
  externalUrl: string | null;
  packagingInfo: string | null;
  category: string;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShopOrder {
  id: string;
  userId: string;
  stripeSessionId: string | null;
  status: OrderStatus;
  totalAed: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ShopOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPriceAed: number;
}

export interface ProductClick {
  id: string;
  productId: string;
  timestamp: Date;
  userId: string;
}

interface OrderLineItem {
  id: string;
  productId: string;
  quantity: number;
  totalAed: number;
  status: OrderStatus;
  fulfillmentTrackingLink: string | null;
  timestamp: Date;
}

interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: Date;
}

interface UserFavorite {
  id: string;
  userId: string;
  locationId: string | null;
  activityId: string | null;
  createdAt: Date;
}

interface Review {
  id: string;
  targetType: ReviewTargetType;
  targetId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Post {
  id: string;
  category: PostCategory;
  title: string;
  content: string;
  images: string[];
  locationId: string | null;
  activityId: string | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PostReply {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

interface PostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}
