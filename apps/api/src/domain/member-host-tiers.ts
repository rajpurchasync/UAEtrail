import { TenantBusinessMode, TenantType } from './enums.js';
import { inferTenantPublishingPurpose, type TenantPublishingPurpose } from './tenant-publishing.js';
import type { HostTierFlags } from '@uaetrail/shared-types';

export const resolveHostTiersFromTenants = (
  tenants: Array<{
    publishingPurpose?: TenantPublishingPurpose | null;
    type: TenantType;
    businessMode?: TenantBusinessMode | null;
  }>,
  profileComplete: boolean
): HostTierFlags => {
  const purposes = tenants.map((t) => inferTenantPublishingPurpose(t));
  return {
    community: profileComplete && purposes.includes('community'),
    professional: purposes.includes('professional'),
    business: purposes.some((p) => p === 'business'),
  };
};
