import { TenantBusinessMode } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { findTenantById } from '../lib/tenant-store.js';

/** Desk shop-profile routes — tenant must be an active shop operator. */
export const assertPublishingShopTenant = async (tenantId: string) => {
  const tenant = await findTenantById(tenantId);
  if (!tenant) {
    throw new ApiError(404, 'tenant_not_found', 'Operator not found.');
  }
  if (tenant.businessMode !== TenantBusinessMode.SHOP) {
    throw new ApiError(403, 'forbidden', 'Publishing shop profile is only available for shop operators.');
  }
  if (tenant.status !== 'ACTIVE') {
    throw new ApiError(403, 'tenant_inactive', 'Operator is not active.');
  }
  return tenant;
};