export type UserRole =
  | 'platform_admin'
  | 'tenant_owner'
  | 'tenant_admin'
  | 'tenant_guide'
  | 'visitor';

export type TenantType = 'company' | 'guide_owned';
export type MembershipRole = 'tenant_owner' | 'tenant_admin' | 'tenant_guide';

export type ActivityType = 'hiking' | 'camping';
export type LocationStatus = 'draft' | 'active' | 'inactive';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'suspended';
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
  accessibleBy?: string[];
  viewCount?: number;
  countryCode?: string;
}

export interface ParticipantPreviewDTO {
  id: string;
  name: string;
  avatar?: string | null;
}

export interface EventDTO {
  id: string;
  tenantId: string;
  tenantSlug: string;
  locationId: string;
  locationName: string;
  activityType: ActivityType;
  title: string;
  description: string;
  date: string;
  time: string;
  price: number;
  slotsTotal: number;
  slotsAvailable: number;
  status: EventStatus;
  meetingPoint?: string | null;
  itinerary?: string[] | null;
  requirements?: string[] | null;
  images?: string[];
  organizerName: string;
  organizerAvatar?: string | null;
  featured?: boolean;
  participantPreviews?: ParticipantPreviewDTO[];
  countryCode?: string;
}

export interface EventDetailDTO extends EventDTO {
  organizerId?: string;
  participants: ParticipantPreviewDTO[];
  location: LocationDTO;
}

export interface JoinRequestDTO {
  id: string;
  eventId: string;
  userId: string;
  status: RequestStatus;
  waitlisted?: boolean;
  note?: string | null;
  organizerNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationDTO {
  id: string;
  title: string;
  body: string;
  type: 'request_update' | 'system' | 'event' | 'review_prompt';
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
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
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
  eventId?: string;
  readAt?: string;
  createdAt: string;
}

// ─── Shop DTOs ──────────────────────────────────────────────────────────────

export type ProductStatusType = 'draft' | 'active' | 'inactive';

export interface ProductDTO {
  id: string;
  name: string;
  description?: string;
  images: string[];
  priceAed: number;
  discountPercent?: number;
  memberDiscountPercent?: number;
  externalUrl?: string | null;
  packagingInfo?: string;
  category: string;
  status: ProductStatusType;
  merchantId: string;
  merchantName: string;
}

export type ReviewTargetType = 'location' | 'tenant';

export interface ReviewDTO {
  id: string;
  targetType: ReviewTargetType;
  targetId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
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
  content: string;
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
  eventId?: string | null;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  likeCount: number;
  replyCount: number;
  replies: PostReplyDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteDTO {
  id: string;
  locationId?: string | null;
  eventId?: string | null;
  createdAt: string;
}

export interface MerchantProfileDTO {
  id: string;
  shopName: string;
  description?: string;
  logo?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// ─── Admin DTOs ─────────────────────────────────────────────────────────────

export type UserStatusType = 'active' | 'suspended';

export interface UserListDTO {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatusType;
  displayName?: string;
  createdAt: string;
}

export interface TenantListDTO {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  status: 'pending' | 'active' | 'suspended';
  ownerName: string;
  memberCount: number;
  eventCount: number;
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
