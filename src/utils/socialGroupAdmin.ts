import type { SocialGroupMemberView, SocialGroupView } from '../api/types';

export const isSocialGroupAdmin = (
  group: SocialGroupView,
  membership: SocialGroupMemberView | null | undefined,
  userId: string | undefined
): boolean => {
  if (!membership || !userId) return false;
  return membership.role === 'admin' || group.adminUserId === userId;
};
