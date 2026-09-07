/**
 * Database-persisted enum values (SCREAMING_SNAKE_CASE).
 * Mirrors Prisma schema enums — use instead of `@prisma/client` imports in store layers.
 */

export const UserRole = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  MERCHANT_ADMIN: 'MERCHANT_ADMIN',
  TENANT_OWNER: 'TENANT_OWNER',
  TENANT_ADMIN: 'TENANT_ADMIN',
  TENANT_GUIDE: 'TENANT_GUIDE',
  PARTICIPANT: 'PARTICIPANT'
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED'
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const AuthProvider = {
  EMAIL: 'EMAIL',
  GOOGLE: 'GOOGLE'
} as const;
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];

export const LocationStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
} as const;
export type LocationStatus = (typeof LocationStatus)[keyof typeof LocationStatus];

export const ActivityType = {
  HIKING: 'HIKING',
  CAMPING: 'CAMPING',
  EVENT: 'EVENT',
  CARPOOL: 'CARPOOL',
  /** @deprecated Use EVENT. Kept so existing Mongo documents still type-check until migrated. */
  COMMUNITY_ACTIVITY: 'COMMUNITY_ACTIVITY'
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const ActivityStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  CANCELLED: 'CANCELLED',
  SUSPENDED: 'SUSPENDED'
} as const;
export type ActivityStatus = (typeof ActivityStatus)[keyof typeof ActivityStatus];

export const RequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  WAITLISTED: 'WAITLISTED'
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export const MembershipRole = {
  TENANT_OWNER: 'TENANT_OWNER',
  TENANT_ADMIN: 'TENANT_ADMIN',
  TENANT_GUIDE: 'TENANT_GUIDE'
} as const;
export type MembershipRole = (typeof MembershipRole)[keyof typeof MembershipRole];

export const MembershipTier = {
  FREE: 'FREE',
  ACTIVE: 'ACTIVE',
  PRO: 'PRO',
  GOAT: 'GOAT'
} as const;
export type MembershipTier = (typeof MembershipTier)[keyof typeof MembershipTier];

export const ProductStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const OrderStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const NotificationType = {
  REQUEST_UPDATE: 'REQUEST_UPDATE',
  SYSTEM: 'SYSTEM',
  ACTIVITY: 'ACTIVITY',
  REVIEW_PROMPT: 'REVIEW_PROMPT'
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const TenantStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED'
} as const;
export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];

export const TenantType = {
  COMPANY: 'COMPANY',
  GUIDE_OWNED: 'GUIDE_OWNED'
} as const;
export type TenantType = (typeof TenantType)[keyof typeof TenantType];

export const TenantBusinessMode = {
  AGENCY: 'AGENCY',
  SHOP: 'SHOP'
} as const;
export type TenantBusinessMode = (typeof TenantBusinessMode)[keyof typeof TenantBusinessMode];

export const RewardAction = {
  SIGNUP_WELCOME: 'SIGNUP_WELCOME',
  REFERRAL_BONUS_REFERRER: 'REFERRAL_BONUS_REFERRER',
  REFERRAL_BONUS_JOINER: 'REFERRAL_BONUS_JOINER',
  LOCATION_SUBMITTED: 'LOCATION_SUBMITTED',
  LOCATION_PUBLISHED: 'LOCATION_PUBLISHED',
  ACTIVITY_PUBLISHED: 'ACTIVITY_PUBLISHED',
  ACTIVITY_HOSTED: 'ACTIVITY_HOSTED',
  TRIP_ATTENDED: 'TRIP_ATTENDED',
  COMMUNITY_POST: 'COMMUNITY_POST',
  COMMUNITY_REPLY: 'COMMUNITY_REPLY',
  REVIEW_WRITTEN: 'REVIEW_WRITTEN'
} as const;
export type RewardAction = (typeof RewardAction)[keyof typeof RewardAction];

export const HostApplicationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;
export type HostApplicationStatus = (typeof HostApplicationStatus)[keyof typeof HostApplicationStatus];

export const Difficulty = {
  EASY: 'EASY',
  MODERATE: 'MODERATE',
  HARD: 'HARD'
} as const;
export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export const Accessibility = {
  CAR_ACCESSIBLE: 'CAR_ACCESSIBLE',
  REMOTE: 'REMOTE'
} as const;
export type Accessibility = (typeof Accessibility)[keyof typeof Accessibility];

export const LocationUnlockSource = {
  PURCHASE: 'PURCHASE',
  SUBSCRIPTION: 'SUBSCRIPTION',
  ADMIN_GRANT: 'ADMIN_GRANT'
} as const;
export type LocationUnlockSource = (typeof LocationUnlockSource)[keyof typeof LocationUnlockSource];

export const ReviewTargetType = {
  LOCATION: 'LOCATION',
  TENANT: 'TENANT'
} as const;
export type ReviewTargetType = (typeof ReviewTargetType)[keyof typeof ReviewTargetType];

export const PostCategory = {
  QUESTIONS: 'QUESTIONS',
  TRIP_REPORTS: 'TRIP_REPORTS',
  PHOTOS: 'PHOTOS',
  TIPS: 'TIPS'
} as const;
export type PostCategory = (typeof PostCategory)[keyof typeof PostCategory];
