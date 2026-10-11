import type { ActivityGroupChatPostPolicy } from '@uaetrail/shared-types';
import { resolveActivityGroupChatPostPolicy } from '@uaetrail/shared-types';
import type { GroupWallPostPolicy } from './group-wall-policy.js';

export const activityGroupChatPostPolicyToWallPolicy = (
  policy: ActivityGroupChatPostPolicy
): GroupWallPostPolicy => (policy === 'host_only' ? 'admins_only' : 'all_members');

export const resolveActivityWallPostPolicyFromDoc = (
  stored?: ActivityGroupChatPostPolicy | null
): GroupWallPostPolicy =>
  activityGroupChatPostPolicyToWallPolicy(resolveActivityGroupChatPostPolicy(stored));
