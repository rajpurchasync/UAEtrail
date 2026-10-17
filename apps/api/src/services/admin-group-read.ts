import { ApiError } from '../lib/api-error.js';
import {
  getSocialGroupAdminDetail,
  listAllSocialGroupsAdmin,
} from '../lib/social-groups-store.js';

export const listAdminSocialGroupsPage = async (input: {
  page: number;
  pageSize: number;
  search?: string;
  type?: 'family' | 'friends';
}) => {
  const skip = (input.page - 1) * input.pageSize;
  const { data, total } = await listAllSocialGroupsAdmin({
    skip,
    take: input.pageSize,
    search: input.search,
    type: input.type,
  });

  return {
    total,
    items: data.map((group) => ({
      ...group,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
    })),
  };
};

export const loadAdminSocialGroupDetail = async (groupId: string) => {
  const detail = await getSocialGroupAdminDetail(groupId);
  if (!detail) {
    throw new ApiError(404, 'group_not_found', 'Group not found.');
  }

  return {
    group: {
      ...detail.group,
      createdAt: detail.group.createdAt.toISOString(),
      updatedAt: detail.group.updatedAt.toISOString(),
    },
    admin: detail.admin,
    members: detail.members.map((member) => ({
      ...member,
      createdAt: member.createdAt.toISOString(),
    })),
    invites: detail.invites.map((invite) => ({
      ...invite,
      acceptedAt: invite.acceptedAt?.toISOString() ?? null,
      expiresAt: invite.expiresAt.toISOString(),
      createdAt: invite.createdAt.toISOString(),
      updatedAt: invite.updatedAt.toISOString(),
    })),
    stats: detail.stats,
  };
};
