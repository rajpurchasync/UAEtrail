import type { ActivityGroupChatPostPolicy } from '@uaetrail/shared-types';
import { resolveActivityGroupChatPostPolicy } from '@uaetrail/shared-types';

export type { ActivityGroupChatPostPolicy };

export const resolveActivityGroupChatPostPolicyFromActivity = (
  stored?: ActivityGroupChatPostPolicy | null
): ActivityGroupChatPostPolicy => resolveActivityGroupChatPostPolicy(stored);

export const activityGroupChatPostPolicyLabel: Record<ActivityGroupChatPostPolicy, string> = {
  all_participants: 'Everyone on the crew can post',
  host_only: 'Only you (host) can post',
};

export const activityGroupChatPostPolicyHint: Record<ActivityGroupChatPostPolicy, string> = {
  all_participants: 'Joiners can read and send messages in the outing chat.',
  host_only: 'Joiners can read updates; you post announcements and replies.',
};
