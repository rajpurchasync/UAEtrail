import type {
  ActivityViewerAccessDTO,
  HostStatusDTO,
  ProfileViewerAccessDTO,
} from '@uaetrail/shared-types';
import { viewerMaySeeProfileViewStats } from '@uaetrail/shared-types';

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
  _ctx: MemberEntitlementContext,
  socialAccess: ActivityViewerAccessDTO
): ActivityViewerAccessDTO => socialAccess;

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
