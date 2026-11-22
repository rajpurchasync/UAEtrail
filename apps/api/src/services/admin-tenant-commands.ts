import { TenantBusinessMode, TenantStatus } from '../domain/enums.js';
import { createAuditLog } from '../lib/audit.js';
import { ApiError } from '../lib/api-error.js';
import { findAdminTenantById, updateAdminTenantStatus } from '../lib/admin-store.js';
import { OPERATOR_OVERVIEW_PATH, PRO_MEMBERSHIP_PATH } from '../lib/member-routes.js';
import { findTenantById, setTenantDiscoverFeatured, setTenantHiddenFromPublic } from '../lib/tenant-store.js';
import { notifyUserAdminAction } from './admin-notifications.js';
import { scheduleExploreMapCacheInvalidation } from '../lib/explore-map-cache-schedule.js';

export const setAdminTenantStatus = async (input: {
  actorId: string;
  tenantId: string;
  status: 'active' | 'suspended';
  comment?: string;
}) => {
  const tenant = await findAdminTenantById(input.tenantId);
  if (!tenant) {
    throw new ApiError(404, 'tenant_not_found', 'Tenant not found.');
  }

  const prismaStatus = input.status === 'active' ? TenantStatus.ACTIVE : TenantStatus.SUSPENDED;
  await updateAdminTenantStatus(input.tenantId, prismaStatus);

  await createAuditLog({
    actorId: input.actorId,
    action: `tenant.${input.status === 'active' ? 'activate' : 'suspend'}`,
    entityType: 'tenant',
    entityId: input.tenantId,
    metadata: input.comment ? { comment: input.comment } : undefined,
  });

  await notifyUserAdminAction({
    userId: tenant.ownerId,
    title: input.status === 'active' ? 'Host account reopened' : 'Host account suspended',
    body:
      input.status === 'active'
        ? `Your host profile "${tenant.name}" is active again. You can create and manage events.`
        : input.comment
          ? `Your host profile "${tenant.name}" has been suspended. Reason: ${input.comment}`
          : `Your host profile "${tenant.name}" has been suspended. Contact support for details.`,
    reason: input.comment,
    meta: {
      kind: input.status === 'active' ? 'host_reopened' : 'host_suspended',
      tenantId: input.tenantId,
      path: input.status === 'active' ? OPERATOR_OVERVIEW_PATH : PRO_MEMBERSHIP_PATH,
    },
  });

  return { message: `Tenant ${input.status === 'active' ? 'activated' : 'suspended'}.` };
};

export const setAdminTenantHiddenFromPublic = async (input: {
  actorId: string;
  tenantId: string;
  hidden: boolean;
}) => {
  const updated = await setTenantHiddenFromPublic(input.tenantId, input.hidden);
  if (!updated) {
    throw new ApiError(404, 'tenant_not_found', 'Tenant not found.');
  }

  await createAuditLog({
    actorId: input.actorId,
    action: input.hidden ? 'tenant.hide' : 'tenant.unhide',
    entityType: 'tenant',
    entityId: input.tenantId,
  });
  scheduleExploreMapCacheInvalidation('admin-tenant.hide_from_public');

  return {
    message: input.hidden ? 'Publishing profile hidden from public surfaces.' : 'Publishing profile is visible again.',
    hiddenFromPublic: updated.hiddenFromPublic ?? false,
  };
};

export const setAdminTenantDiscoverFeatured = async (input: {
  actorId: string;
  tenantId: string;
  featured: boolean;
}) => {
  const mongoTenant = await findTenantById(input.tenantId);
  if (!mongoTenant || mongoTenant.businessMode !== TenantBusinessMode.SHOP) {
    throw new ApiError(400, 'shop_tenant_required', 'Discover featuring applies to gear shop tenants only.');
  }

  const updated = await setTenantDiscoverFeatured(input.tenantId, input.featured);
  if (!updated) {
    throw new ApiError(404, 'tenant_not_found', 'Tenant not found.');
  }

  await createAuditLog({
    actorId: input.actorId,
    action: input.featured ? 'tenant.discover_feature' : 'tenant.discover_unfeature',
    entityType: 'tenant',
    entityId: input.tenantId,
  });

  return {
    message: input.featured ? 'Shop featured on discover home.' : 'Shop removed from discover home.',
    discoverFeatured: updated.discoverFeatured ?? false,
  };
};
