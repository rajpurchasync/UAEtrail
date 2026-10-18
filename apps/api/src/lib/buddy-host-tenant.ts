import { MembershipRole, TenantStatus, TenantType } from '../domain/enums.js';
import { TenantPublishingPurpose } from '../domain/tenant-publishing.js';
import { findAuthUserById } from './auth-users-store.js';
import { newEntityId } from './entity-builders.js';
import { upsertTenantMembership } from './tenant-access.js';
import {
  ensureUniqueTenantSlug,
  findTenantById,
  listTenantsByOwnerId,
  pickActivityTenant,
  writeTenantToMongo,
  type TenantRecord,
} from './tenant-store.js';
import { slugify } from './slug.js';

/** Ensure tenant owner has a membership row (fixes /host scope without duplicating owner checks). */
export const ensureOwnerMembershipForTenant = async (
  userId: string,
  tenantId: string
): Promise<void> => {
  const tenant = await findTenantById(tenantId);
  if (!tenant || tenant.ownerId !== userId || tenant.status !== TenantStatus.ACTIVE) return;

  await upsertTenantMembership({
    tenantId,
    userId,
    role: MembershipRole.TENANT_OWNER,
  });
};

/**
 * Personal guide-owned tenant for buddy hosts (organize on map).
 * Idempotent when an activity-capable tenant already exists.
 */
export const ensureBuddyHostTenant = async (userId: string): Promise<TenantRecord | null> => {
  const owned = await listTenantsByOwnerId(userId);
  const existing = pickActivityTenant(owned);
  if (existing) {
    await ensureOwnerMembershipForTenant(userId, existing.id);
    return existing;
  }

  const user = await findAuthUserById(userId);
  if (!user) return null;

  const displayName = user.profile?.displayName?.trim();
  const baseName = displayName || user.email.split('@')[0] || 'Member';
  const slug = await ensureUniqueTenantSlug(slugify(`${baseName}-${userId.slice(0, 8)}`));
  const tenantId = newEntityId();
  const now = new Date();

  const tenant: TenantRecord = {
    id: tenantId,
    name: displayName || baseName,
    slug,
    type: TenantType.GUIDE_OWNED,
    businessMode: null,
    status: TenantStatus.ACTIVE,
    ownerId: userId,
    countryCode: user.profile?.countryCode ?? 'AE',
    description: user.profile?.bio ?? null,
    website: null,
    logoUrl: user.profile?.avatarUrl ?? null,
    services: null,
    latitude: null,
    longitude: null,
    region: user.profile?.city ?? null,
    publishingPurpose: TenantPublishingPurpose.COMMUNITY,
    createdAt: now,
    updatedAt: now,
  };

  await writeTenantToMongo(tenant);
  await upsertTenantMembership({
    tenantId,
    userId,
    role: MembershipRole.TENANT_OWNER,
  });

  return tenant;
};
