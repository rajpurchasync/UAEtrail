import {
  TenantBusinessMode,
  TenantType,
  UserRole,
} from '../domain/enums.js';
import { isSignupProfileComplete } from '../domain/user-profile.js';
import { resolveHostTiersFromTenants } from '../domain/member-host-tiers.js';
import { resolveMemberProfileRoleLabel } from '../domain/member-profile-label.js';
import { listActiveTenantMembershipsByUser } from '../lib/activities-store.js';
import { findAuthUserById } from '../lib/auth-users.js';
import { isCommunityHostByUserId } from '../lib/community-host.js';
import { ensureBuddyHostTenant, ensureOwnerMembershipForTenant } from '../lib/buddy-host-tenant.js';
import { findLatestHostApplicationByApplicant } from '../lib/host-applications-store.js';
import {
  listTenantsByOwnerId,
  mergeActiveTenantsForHostStatus,
  pickActivityTenant,
  resolveOwnedProfileType,
} from '../lib/tenant-store.js';
import { resolvePublishingProfileKind } from '@uaetrail/shared-types';
import type { HostStatusDTO } from '@uaetrail/shared-types';
import { inferTenantPublishingPurpose } from '../domain/tenant-publishing.js';

/** Canonical resolver for `GET /me/host-status` — keep all tier logic here. */
export const resolveMemberHostStatus = async (userId: string): Promise<HostStatusDTO> => {
  const user = await findAuthUserById(userId);
  const role = user?.role ?? UserRole.PARTICIPANT;
  const isHostRole =
    role === UserRole.TENANT_OWNER ||
    role === UserRole.TENANT_ADMIN ||
    role === UserRole.TENANT_GUIDE;
  const isPlatformAdmin = role === UserRole.PLATFORM_ADMIN;

  const profileComplete = isSignupProfileComplete(user?.profile);

  let ownedByOwnerId = await listTenantsByOwnerId(userId);
  let memberships = await listActiveTenantMembershipsByUser(userId);

  if (profileComplete) {
    const mergedPre = mergeActiveTenantsForHostStatus(ownedByOwnerId, memberships);
    const activityPre = pickActivityTenant(mergedPre);
    if (!activityPre) {
      await ensureBuddyHostTenant(userId);
      ownedByOwnerId = await listTenantsByOwnerId(userId);
      memberships = await listActiveTenantMembershipsByUser(userId);
    } else {
      await ensureOwnerMembershipForTenant(userId, activityPre.id);
      memberships = await listActiveTenantMembershipsByUser(userId);
    }
  }

  const ownedTenants = mergeActiveTenantsForHostStatus(ownedByOwnerId, memberships);
  const ownedProfiles = ownedTenants.map((tenant) => {
    const type = resolveOwnedProfileType(tenant);
    return {
      type,
      tenantId: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      publishingProfileKind: resolvePublishingProfileKind({
        ownedType: type,
        publishingTier: inferTenantPublishingPurpose(tenant),
      }),
    };
  });

  const hasGuideProfile = ownedProfiles.some((profile) => profile.type === 'guide');
  const hasAgencyProfile = ownedProfiles.some((profile) => profile.type === 'agency');
  const hasShopProfile = ownedProfiles.some((profile) => profile.type === 'shop');

  const activityTenant = pickActivityTenant(ownedTenants);
  const tenantId = activityTenant?.id ?? null;

  const application = await findLatestHostApplicationByApplicant(userId);
  let applicationStatus: HostStatusDTO['applicationStatus'] = 'none';
  if (application) {
    const normalized = application.status.toLowerCase();
    if (normalized === 'pending' || normalized === 'approved' || normalized === 'rejected') {
      applicationStatus = normalized;
    }
  }

  const canPublish = isPlatformAdmin || (profileComplete && Boolean(activityTenant));
  const isCommunityHost = await isCommunityHostByUserId(userId);
  const hostTiers = resolveHostTiersFromTenants(ownedTenants, profileComplete);

  let tenantType: HostStatusDTO['tenantType'] = null;
  let businessMode: HostStatusDTO['businessMode'] = null;
  if (activityTenant) {
    tenantType = activityTenant.type === TenantType.COMPANY ? 'company' : 'guide_owned';
    businessMode =
      activityTenant.businessMode === TenantBusinessMode.AGENCY
        ? 'agency'
        : activityTenant.businessMode === TenantBusinessMode.SHOP
          ? 'shop'
          : null;
  }

  const canHostPaidActivities = isPlatformAdmin || hasAgencyProfile;
  const profileRoleLabel = resolveMemberProfileRoleLabel({
    role,
    hostTiers,
    isCommunityHost,
    hasAgencyProfile,
    hasShopProfile,
  });

  const canAccessHostConsole =
    isPlatformAdmin || canPublish || hostTiers.business || isHostRole;

  return {
    signupProfileComplete: profileComplete,
    isCommunityHost,
    hostTiers,
    profileRoleLabel,
    canPublish,
    canAccessHostConsole,
    applicationStatus,
    tenantId,
    isHostRole,
    hasTenant: ownedTenants.length > 0,
    tenantType,
    businessMode,
    canHostPaidActivities,
    hasGuideProfile,
    hasAgencyProfile,
    hasShopProfile,
    ownedProfiles,
  };
};
