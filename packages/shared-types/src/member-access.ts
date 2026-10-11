import type { HostTierFlags } from './host-publishing-tier.js';

/** Subset of `HostStatusDTO` used for audience + Organize gates (avoid circular imports). */
export type HostStatusAudienceSnapshot = {
  signupProfileComplete: boolean;
  hostTiers: HostTierFlags;
  isCommunityHost: boolean;
};

/**
 * Who the viewer is for **member / capability** gating (Organize, Pro, console).
 * Orthogonal to activity **social** viewer access (`activity-viewer-access.ts`).
 *
 * @see docs/MEMBER_MODEL.md § Member audience ladder
 * @see docs/DOMAIN_CANONICALS.md §15.10
 */
export type MemberAudience =
  | 'guest'
  /** Signed in; `/welcome` profile incomplete — cannot Organize (buddy host). */
  | 'member_incomplete'
  /** Profile complete; buddy / community publish path (`canPublish` when tenant exists). */
  | 'member_basic'
  /** Pro guide tenant (`hostTiers.professional`). */
  | 'member_professional'
  /** Agency / shop / company team (`hostTiers.business`). */
  | 'member_business';

/** Future paid consumer / Pro SKUs — wire when product ships; do not infer from `hostTiers` alone. */
export type PaidMembershipSku = 'none' | 'consumer_pro' | 'host_pro';

/**
 * Product entitlements composed **after** social viewer access (layer 7).
 * Add ids here; enforce in `member-entitlements.ts` (API).
 */
export type MemberEntitlementId =
  | 'sign_in'
  | 'complete_profile'
  | 'organize_publish'
  | 'host_console'
  | 'paid_consumer_detail'
  | 'paid_host_commercial'
  /** Pro carpool / transport tab on activity detail (layer 7 — not crew surfaces). */
  | 'activity_pro_transport'
  | 'pro_member_directory'
  | 'pro_profile_view_stats';

export type MemberEntitlementDenial = {
  entitlement: MemberEntitlementId;
  /** Maps to UI: sign-in sheet, `/welcome`, Pro page, join flow, etc. */
  gateReason:
    | 'sign_in'
    | 'profile_required'
    | 'join_required'
    | 'upgrade_required'
    | 'invite_only'
    | null;
};

const hostStatusAudienceInput = (
  hostStatus: Pick<HostStatusAudienceSnapshot, 'signupProfileComplete' | 'hostTiers'> | null
): Pick<HostStatusAudienceSnapshot, 'signupProfileComplete' | 'hostTiers'> | null => hostStatus;

/** Resolve audience from auth + optional `GET /me/host-status` snapshot (server or hydrated client). */
export const resolveMemberAudience = (input: {
  viewerUserId: string | null;
  hostStatus: Pick<HostStatusAudienceSnapshot, 'signupProfileComplete' | 'hostTiers'> | null;
}): MemberAudience => {
  if (!input.viewerUserId) return 'guest';
  const status = hostStatusAudienceInput(input.hostStatus);
  if (!status?.signupProfileComplete) return 'member_incomplete';
  if (status.hostTiers.business) return 'member_business';
  if (status.hostTiers.professional) return 'member_professional';
  return 'member_basic';
};

/** Whether this audience may run buddy Organize (`canPublish` prerequisite is profile + tenant). */
export const memberAudienceMayAttemptOrganize = (audience: MemberAudience): boolean =>
  audience === 'member_basic' ||
  audience === 'member_professional' ||
  audience === 'member_business';

/** Profile “Host” badge on map — first activity or demand; not the same as profile-complete. */
export const memberHasHostFootprintBadge = (
  hostStatus: Pick<HostStatusAudienceSnapshot, 'isCommunityHost'> | null
): boolean => Boolean(hostStatus?.isCommunityHost);

/** Placeholder until paid membership is stored — always `none` until billing ships. */
export const resolvePaidMembershipSku = (
  _hostStatus: HostStatusAudienceSnapshot | null
): PaidMembershipSku => 'none';

/** Signed-in members may open the Discover directory list (quota applies on profile open). */
export const viewerMayBrowsePublicMemberDirectory = (input: {
  viewerUserId: string | null;
}): boolean => Boolean(input.viewerUserId);

/** Host Pro / business — profile view analytics on `/me/profile-view-stats`. */
export const viewerMaySeeProfileViewStats = (input: {
  viewerUserId: string | null;
  hostStatus: Pick<HostStatusAudienceSnapshot, 'hostTiers'> | null;
}): boolean => {
  if (!input.viewerUserId) return false;
  const tiers = input.hostStatus?.hostTiers;
  return Boolean(tiers?.professional || tiers?.business);
};

/** Map audience → primary entitlement denial for Organize FAB (capabilities, not activity detail). */
export const organizeEntitlementDenial = (input: {
  viewerUserId: string | null;
  hostStatus: HostStatusAudienceSnapshot | null;
  canPublish: boolean;
}): MemberEntitlementDenial | null => {
  const audience = resolveMemberAudience({
    viewerUserId: input.viewerUserId,
    hostStatus: input.hostStatus,
  });
  if (audience === 'guest') {
    return { entitlement: 'sign_in', gateReason: 'sign_in' };
  }
  if (audience === 'member_incomplete') {
    return { entitlement: 'complete_profile', gateReason: 'profile_required' };
  }
  if (!input.canPublish) {
    return { entitlement: 'organize_publish', gateReason: 'upgrade_required' };
  }
  return null;
};

