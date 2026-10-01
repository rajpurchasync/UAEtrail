import type { GroupMemberRecord, GroupRecord } from './social-groups-store.js';

export type GroupWallPostPolicy = 'all_members' | 'admins_only';

export const GROUP_WALL_POST_POLICIES: GroupWallPostPolicy[] = ['all_members', 'admins_only'];

export const resolveGroupWallPostPolicy = (group: Pick<GroupRecord, 'wallPostPolicy'>): GroupWallPostPolicy =>
  group.wallPostPolicy ?? 'all_members';

export const canMemberPostToGroupWall = (
  group: Pick<GroupRecord, 'wallPostPolicy'>,
  membership: Pick<GroupMemberRecord, 'role'>
): boolean => {
  const policy = resolveGroupWallPostPolicy(group);
  if (policy === 'admins_only') return membership.role === 'admin';
  return true;
};
