import { describe, expect, it } from 'vitest';
import {
  activityGroupChatPostPolicyToWallPolicy,
  resolveActivityWallPostPolicyFromDoc,
} from '../src/lib/activity-group-chat-post-policy.js';

describe('activity group chat post policy', () => {
  it('maps host_only to admins_only wall policy', () => {
    expect(activityGroupChatPostPolicyToWallPolicy('host_only')).toBe('admins_only');
    expect(activityGroupChatPostPolicyToWallPolicy('all_participants')).toBe('all_members');
  });

  it('defaults missing activity policy to all_members on wall', () => {
    expect(resolveActivityWallPostPolicyFromDoc(null)).toBe('all_members');
    expect(resolveActivityWallPostPolicyFromDoc(undefined)).toBe('all_members');
  });
});
