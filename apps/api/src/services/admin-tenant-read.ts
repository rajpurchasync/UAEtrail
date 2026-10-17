import { ApiError } from '../lib/api-error.js';
import {
  findAdminTenantDetailedById,
  listAdminTenantsPaged,
} from '../lib/admin-store.js';
import { findTenantById } from '../lib/tenant-store.js';

export const listAdminTenantsPage = async (input: { page: number; pageSize: number }) => {
  const { items: tenants, total } = await listAdminTenantsPaged({
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  });

  return {
    total,
    items: tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      type: t.type.toLowerCase(),
      status: t.status.toLowerCase(),
      ownerName: t.owner.profile?.displayName ?? t.owner.email,
      ownerEmail: t.owner.email,
      memberCount: t._count.memberships,
      activityCount: t._count.activities,
      createdAt: t.createdAt,
    })),
  };
};

export const loadAdminTenantDetail = async (tenantId: string) => {
  const tenant = await findAdminTenantDetailedById(tenantId);
  if (!tenant) {
    throw new ApiError(404, 'tenant_not_found', 'Tenant not found.');
  }

  const mongoTenant = await findTenantById(tenantId);

  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    type: tenant.type.toLowerCase(),
    status: tenant.status.toLowerCase(),
    businessMode: mongoTenant?.businessMode?.toLowerCase() ?? null,
    discoverFeatured: mongoTenant?.discoverFeatured ?? false,
    owner: {
      id: tenant.owner.id,
      email: tenant.owner.email,
      displayName: tenant.owner.profile?.displayName ?? null,
    },
    createdAt: tenant.createdAt,
    members: tenant.memberships.map((m) => ({
      userId: m.userId,
      email: m.user.email,
      displayName: m.user.profile?.displayName ?? null,
      role: m.role.toLowerCase(),
      joinedAt: m.createdAt,
    })),
    activities: tenant.activities.map((e) => ({
      id: e.id,
      title: e.title,
      locationName: e.location.name,
      startAt: e.startAt,
      status: e.status.toLowerCase(),
      capacity: e.capacity,
      participantCount: e.participants.length,
      checkedInCount: e.participants.filter((p) => p.checkedInAt !== null).length,
      guideName: e.guide?.profile?.displayName ?? null,
    })),
  };
};
