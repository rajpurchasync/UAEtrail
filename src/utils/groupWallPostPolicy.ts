import type { SocialGroupMemberView, SocialGroupView } from '../api/types';

export type GroupWallPostPolicy = 'all_members' | 'admins_only';

export const resolveGroupWallPostPolicy = (
  group: Pick<SocialGroupView, 'wallPostPolicy'>
): GroupWallPostPolicy => group.wallPostPolicy ?? 'all_members';

export const canMemberPostToGroupWall = (
  group: Pick<SocialGroupView, 'wallPostPolicy'>,
  membership: Pick<SocialGroupMemberView, 'role'>
): boolean => {
  const policy = resolveGroupWallPostPolicy(group);
  if (policy === 'admins_only') return membership.role === 'admin';
  return true;
};

export const groupWallPostPolicyLabel: Record<GroupWallPostPolicy, string> = {
  all_members: 'Everyone can message',
  admins_only: 'Only admins can message',
};
