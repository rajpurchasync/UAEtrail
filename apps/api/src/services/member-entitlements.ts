import type {
  ActivityViewerAccessDTO,
  HostStatusDTO,
  ProfileViewerAccessDTO,
} from '@uaetrail/shared-types';
import { resolvePaidMembershipSku, viewerMaySeeProfileViewStats } from '@uaetrail/shared-types';

export type MemberEntitlementContext = {
  viewerUserId: string | null;
  /** Load from `resolveMemberHostStatus` when a rule needs capabilities or paid SKU. */
  hostStatus: HostStatusDTO | null;
};

/**
 * Layer 7 — apply paid / Pro / premium rules **after** social activity viewer access.
 * Passthrough until `PaidMembershipSku` and product rules ship.
 *
 * @see docs/DOMAIN_CANONICALS.md §15.10
 */
export const applyActivityViewEntitlements = (
  ctx: MemberEntitlementContext,
  socialAccess: ActivityViewerAccessDTO
): ActivityViewerAccessDTO => {
  const paidSku = resolvePaidMembershipSku(ctx.hostStatus);
  // Layer 7 hooks (billing not wired): `activity_pro_transport`, `paid_consumer_detail`, …
  if (paidSku === 'none') {
    return socialAccess;
  }
  return socialAccess;
};

/** Layer 7 — profile detail (passthrough until paid consumer rules ship). */
export const applyProfileViewEntitlements = (
  _ctx: MemberEntitlementContext,
  socialAccess: ProfileViewerAccessDTO
): ProfileViewerAccessDTO => socialAccess;

export const maySeeProfileViewStats = (ctx: MemberEntitlementContext): boolean =>
  viewerMaySeeProfileViewStats({
    viewerUserId: ctx.viewerUserId,
    hostStatus: ctx.hostStatus,
  });
