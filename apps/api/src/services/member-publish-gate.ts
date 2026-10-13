import { memberProfileComplete } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { resolveMemberStatus } from './member-status.js';

/** Enforce organize/publish rules before creating or publishing activities. */
export const assertMemberCanPublishActivities = async (
  userId: string,
  options?: { platformAdmin?: boolean }
): Promise<void> => {
  if (options?.platformAdmin) return;

  const status = await resolveMemberStatus(userId);
  if (!memberProfileComplete(status)) {
    throw new ApiError(
      403,
      'profile_incomplete',
      'Complete your profile before publishing activities.'
    );
  }
  if (!status.canPublish) {
    throw new ApiError(403, 'publish_not_allowed', 'You cannot publish activities yet.');
  }
};
