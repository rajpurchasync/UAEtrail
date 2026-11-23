import {
  memberGuideProfileComplete,
  memberProfileComplete,
  type MemberStatusDTO,
} from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { canPublishFromMemberStatus } from '../lib/product-capability-gate.js';
import { resolveMemberStatus } from './member-status.js';

/** Enforce organize/publish rules before creating or publishing activities. */
export const assertMemberCanPublishActivities = async (
  userId: string,
  options?: { platformAdmin?: boolean; pricingMode?: 'free' | 'shared' | 'paid' | null }
): Promise<void> => {
  if (options?.platformAdmin) return;

  const status = await resolveMemberStatus(userId);
  if (!memberProfileComplete(status)) {
    throw new ApiError(
      403,
      'profile_incomplete',
      'Complete your signup profile before publishing activities.'
    );
  }
  if (!memberGuideProfileComplete(status)) {
    throw new ApiError(
      403,
      'guide_profile_incomplete',
      'Complete your guide profile before publishing activities.'
    );
  }
  const publishStatus = {
    publish: { canPublish: status.canPublish, canAccessPublishingWorkspace: status.canAccessPublishingWorkspace },
  } as MemberStatusDTO;
  if (!canPublishFromMemberStatus(publishStatus)) {
    throw new ApiError(403, 'publish_not_allowed', 'You cannot publish activities yet.');
  }
  if (options?.pricingMode === 'paid' && !status.canHostPaidActivities) {
    throw new ApiError(
      403,
      'paid_publish_not_allowed',
      'Paid outings require a verified business or Pro operator profile.'
    );
  }
};
