import { TenantBusinessMode, TenantType } from './enums.js';
import type { HostPublishingTier } from '@uaetrail/shared-types';

export const TenantPublishingPurpose = {
  COMMUNITY: 'community',
  PROFESSIONAL: 'professional',
  BUSINESS: 'business',
} as const;
export type TenantPublishingPurpose =
  (typeof TenantPublishingPurpose)[keyof typeof TenantPublishingPurpose];

export const inferTenantPublishingPurpose = (tenant: {
  type: TenantType;
  businessMode?: TenantBusinessMode | null;
  publishingPurpose?: TenantPublishingPurpose | null;
}): HostPublishingTier => {
  if (tenant.publishingPurpose === TenantPublishingPurpose.COMMUNITY) return 'community';
  if (tenant.publishingPurpose === TenantPublishingPurpose.PROFESSIONAL) return 'professional';
  if (tenant.publishingPurpose === TenantPublishingPurpose.BUSINESS) return 'business';
  if (tenant.type === TenantType.COMPANY || tenant.businessMode) return 'business';
  return 'community';
};

export const publishingPurposeForHostApplication = (
  hostProfileType: string
): TenantPublishingPurpose => {
  const normalized = hostProfileType.toLowerCase();
  if (normalized === 'individual') return TenantPublishingPurpose.PROFESSIONAL;
  return TenantPublishingPurpose.BUSINESS;
};
