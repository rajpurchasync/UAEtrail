import { ApiError } from '../lib/api-error.js';
import { resolveMemberHostStatus } from './member-host-status.js';

/** Enforce buddy-host rules before creating or publishing activities. */
export const assertMemberCanPublishActivities = async (
  userId: string,
  options?: { platformAdmin?: boolean }
): Promise<void> => {
  if (options?.platformAdmin) return;

  const status = await resolveMemberHostStatus(userId);
  if (!status.signupProfileComplete) {
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
