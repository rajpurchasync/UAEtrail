import {
  isWomenOnlyActivityRequirements,
  resolveWomenOnlyJoinEligibility,
  womenOnlyJoinBlockMessage,
} from '@uaetrail/shared-types';
import { findAuthUserById } from '../lib/auth-users.js';
import { ApiError } from '../lib/api-error.js';

export { isWomenOnlyActivityRequirements };

/** Enforce women-only outings for join requests, RSVP, and host approval. */
export const assertParticipantMeetsWomenOnlyRequirement = async (
  userId: string,
  requirements: string[] | null | undefined
): Promise<void> => {
  if (!isWomenOnlyActivityRequirements(requirements)) return;

  const user = await findAuthUserById(userId);
  if (!user) {
    throw new ApiError(401, 'unauthorized', 'Sign in to join this activity.');
  }

  const eligibility = resolveWomenOnlyJoinEligibility(requirements, user.profile?.gender ?? null);
  const message = womenOnlyJoinBlockMessage(eligibility);
  if (!message) return;

  const code =
    eligibility === 'ineligible_gender' ? 'women_only_restriction' : 'women_only_profile_required';
  throw new ApiError(403, code, message);
};
