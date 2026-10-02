import type { RewardAction } from '../domain/enums.js';
import { recordMemberAction } from './member-badges.js';

export interface AwardPointsInput {
  userId: string;
  action: RewardAction;
  referenceId: string;
  label?: string;
  meta?: Record<string, unknown>;
  notify?: boolean;
}

/** @deprecated Trail Points removed — records badge progress only. */
export async function awardPoints(input: AwardPointsInput): Promise<{ awarded: boolean; points: number }> {
  const { recorded } = await recordMemberAction(input);
  return { awarded: recorded, points: 0 };
}

export { processSignupBadges as processSignupRewards } from './member-badges.js';
