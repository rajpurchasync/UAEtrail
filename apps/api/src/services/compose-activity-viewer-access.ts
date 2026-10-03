import type { ActivityViewerAccessDTO } from '@uaetrail/shared-types';
import {
  applyActivityViewEntitlements,
  type MemberEntitlementContext,
} from './member-entitlements.js';
import {
  resolveActivityViewerAccess,
  type ActivityViewerAccessInput,
} from './activity-viewer-access.js';

/**
 * Social viewer access (layers 3–6) then entitlement policy (layer 7).
 * `hostStatus` is optional until paid SKUs need it — avoid loading on every anonymous read.
 */
export const composeActivityViewerAccess = async (
  input: ActivityViewerAccessInput,
  entitlementCtx: MemberEntitlementContext
): Promise<ActivityViewerAccessDTO> => {
  const socialAccess = await resolveActivityViewerAccess(input);
  return applyActivityViewEntitlements(entitlementCtx, socialAccess);
};
