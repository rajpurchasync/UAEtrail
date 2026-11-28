import {
  TenantBusinessMode,
  TenantType,
  UserRole,
} from '../domain/enums.js';
import { isSignupProfileComplete } from '../domain/user-profile.js';
import { resolveHostTiersFromTenants } from '../domain/member-host-tiers.js';
import { resolveMemberProfileRoleLabel } from '../domain/member-profile-label.js';
import { listActiveTenantMembershipsByUser } from '../lib/activities-store.js';
import { findAuthUserById, type AuthUserRecord } from '../lib/auth-users-store.js';
import { isCommunityHostByUserId } from '../lib/community-host.js';
import { ensureFriendHostTenant, ensureOwnerMembershipForTenant } from '../lib/friend-host-tenant.js';
import { findLatestHostApplicationByApplicant } from '../lib/host-applications-store.js';
import { countPublishedActivitiesHostedByUserIds } from '../lib/activity-engagement-store.js';
import { listActiveTenantMembershipsByUserIds } from '../lib/tenant-access.js';
import { countActiveFixedAvailabilityMapSlotsForUser } from '../lib/member-availability-store.js';
import {
  listTenantsByOwnerId,
  listTenantsByOwnerIds,
  mergeActiveTenantsForHostStatus,
  pickActivityTenant,
  resolveOwnedProfileType,
} from '../lib/tenant-store.js';
import {
  isGuideProfileComplete,
  isMedicalSafetyProfileComplete,
  resolvePublishingProfileKind,
} from '@uaetrail/shared-types';
import { medicalSafetyFieldsFromAuthProfile } from '../lib/member-medical-safety-profile.js';
import type { HostStatusDTO, MemberProfileRoleLabel } from '@uaetrail/shared-types';
import { inferTenantPublishingPurpose } from '../domain/tenant-publishing.js';
import { resolveOperatorWorkspaceAccess } from './member-operator-workspace-access.js';

/** Read-only role labels for member browse directory (no buddy-tenant side effects). */
export const batchResolveMemberProfileRoleLabelsForDirectory = async (
  users: AuthUserRecord[]
): Promise<Map<string, MemberProfileRoleLabel>> => {
  const labels = new Map<string, MemberProfileRoleLabel>();
  if (users.length === 0) return labels;

  const userIds = users.map((user) => user._id);
  const [ownedByOwnerId, membershipsByUser, hostedCounts] = await Promise.all([
    listTenantsByOwnerIds(userIds),
    listActiveTenantMembershipsByUserIds(userIds),
    countPublishedActivitiesHostedByUserIds(userIds),
  ]);

  const needIntentCheck: string[] = [];
  const communityHostByUserId = new Map<string, boolean>();
  for (const userId of userIds) {
    if ((hostedCounts.get(userId) ?? 0) > 0) {
      communityHostByUserId.set(userId, true);
    } else {
      needIntentCheck.push(userId);
    }
  }
  if (needIntentCheck.length > 0) {
    const intentPairs = await Promise.all(
      needIntentCheck.map(
        async (userId) => [userId, await countActiveFixedAvailabilityMapSlotsForUser(userId)] as const
      )
    );
    for (const [userId, count] of intentPairs) {
      communityHostByUserId.set(userId, count > 0);
    }
  }

  for (const user of users) {
    const role = user.role ?? UserRole.PARTICIPANT;
    const guideProfileComplete = isGuideProfileComplete(user.profile);
    const ownedTenants = mergeActiveTenantsForHostStatus(
      ownedByOwnerId.get(user._id) ?? [],
      membershipsByUser.get(user._id) ?? []
    );
    const hostTiers = resolveHostTiersFromTenants(ownedTenants, guideProfileComplete);
    const hasAgencyProfile = ownedTenants.some((tenant) => resolveOwnedProfileType(tenant) === 'agency');
    const hasShopProfile = ownedTenants.some((tenant) => resolveOwnedProfileType(tenant) === 'shop');
    labels.set(
      user._id,
      resolveMemberProfileRoleLabel({
        role,
        hostTiers,
        isCommunityHost: communityHostByUserId.get(user._id) ?? false,
        hasAgencyProfile,
        hasShopProfile,
      })
    );
  }

  return labels;
};

/** Canonical resolver for `GET /me/status` — keep all member capability / publish tier logic here. */
export const resolveMemberStatus = async (userId: string): Promise<HostStatusDTO> => {
  const user = await findAuthUserById(userId);
  const role = user?.role ?? UserRole.PARTICIPANT;
  const isHostRole =
    role === UserRole.TENANT_OWNER ||
    role === UserRole.TENANT_ADMIN ||
    role === UserRole.TENANT_GUIDE;
  const isPlatformAdmin = role === UserRole.PLATFORM_ADMIN;

  const profileComplete = isSignupProfileComplete(user?.profile);
  const guideProfileComplete = isGuideProfileComplete(user?.profile);
  const medicalSafetyProfileComplete = isMedicalSafetyProfileComplete(
    medicalSafetyFieldsFromAuthProfile(user?.profile)
  );

  let ownedByOwnerId = await listTenantsByOwnerId(userId);
  let memberships = await listActiveTenantMembershipsByUser(userId);

  if (guideProfileComplete) {
    const mergedPre = mergeActiveTenantsForHostStatus(ownedByOwnerId, memberships);
    const activityPre = pickActivityTenant(mergedPre);
    if (!activityPre) {
      await ensureFriendHostTenant(userId);
      ownedByOwnerId = await listTenantsByOwnerId(userId);
      memberships = await listActiveTenantMembershipsByUser(userId);
    } else {
      const hasMembership = memberships.some((membership) => membership.tenantId === activityPre.id);
      if (!hasMembership) {
        await ensureOwnerMembershipForTenant(userId, activityPre.id);
        memberships = await listActiveTenantMembershipsByUser(userId);
      }
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

  const canPublish = isPlatformAdmin || (guideProfileComplete && Boolean(activityTenant));
  const isCommunityHost = await isCommunityHostByUserId(userId);
  const hostTiers = resolveHostTiersFromTenants(ownedTenants, guideProfileComplete);

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

  /** Linked business tenant — paid only when publishing as that business (see `allowedActivityPricingModes`). */
  const canHostPaidActivities = isPlatformAdmin || hostTiers.business;
  const profileRoleLabel = resolveMemberProfileRoleLabel({
    role,
    hostTiers,
    isCommunityHost,
    hasAgencyProfile,
    hasShopProfile,
  });

  const canAccessOperatorWorkspace = resolveOperatorWorkspaceAccess({
    isPlatformAdmin,
    canPublish,
    hostTiers,
  });
  const isPlatformStaff = isPlatformAdmin;

  return {
    profileComplete,
    guideProfileComplete,
    medicalSafetyProfileComplete,
    isCommunityHost,
    hostTiers,
    profileRoleLabel,
    canPublish,
    canAccessOperatorWorkspace,
    isPlatformStaff,
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
