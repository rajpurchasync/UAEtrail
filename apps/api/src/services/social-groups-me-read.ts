import { ApiError } from '../lib/api-error.js';
import {
  findGroupById,
  getGroupMembership,
  listGroupInvites,
  listGroupMembersDetailed,
  listGroupsForUserWithChatPreview,
  listGroupWallMessages,
} from '../lib/social-groups-store.js';

export const listMyGroupsWithChatPreview = async (userId: string) => {
  const groups = await listGroupsForUserWithChatPreview(userId);
  return groups.map((group) => ({
    ...group,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    chatPreview: group.chatPreview,
  }));
};

export const loadMyGroupDetail = async (groupId: string, userId: string) => {
  const membership = await getGroupMembership(groupId, userId);
  if (!membership) {
    throw new ApiError(403, 'forbidden', 'You are not a member of this group.');
  }

  const group = await findGroupById(groupId);
  if (!group) {
    throw new ApiError(404, 'group_not_found', 'Group not found.');
  }

  const [members, invites] = await Promise.all([
    listGroupMembersDetailed(groupId),
    membership.role === 'admin' ? listGroupInvites(groupId) : Promise.resolve([]),
  ]);

  return {
    group,
    membership,
    members,
    invites,
  };
};

export const listMyGroupWallMessages = async (
  groupId: string,
  userId: string,
  query: {
    limit?: number;
    since?: string;
    before?: string;
    beforeMessageId?: string;
  }
) => {
  const membership = await getGroupMembership(groupId, userId);
  if (!membership) {
    throw new ApiError(403, 'forbidden', 'You are not a member of this group.');
  }
  const { messages, hasMoreOlder } = await listGroupWallMessages(groupId, {
    limit: query.limit ?? 120,
    viewerUserId: userId,
    since: query.since ? new Date(query.since) : undefined,
    before: query.before ? new Date(query.before) : undefined,
    beforeMessageId: query.beforeMessageId,
  });
  return { messages, hasMoreOlder };
};
