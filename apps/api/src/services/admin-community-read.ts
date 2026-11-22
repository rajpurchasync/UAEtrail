import type {
  AdminCommunityDetailDTO,
  AdminCommunityHostContactDTO,
  AdminCommunityListItemDTO,
  AdminCommunityInviteRowDTO,
  AdminCommunityMemberRowDTO,
} from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { findAuthUsersByIds } from '../lib/auth-users-store.js';
import { listCommunityGroupInvites } from '../lib/community-group-invites-store.js';
import { listCommunityGroupMembers } from '../lib/community-group-members-store.js';
import {
  findCommunityById,
  listAdminCommunityGroups,
  type CommunityGroupRecord,
} from '../lib/community-groups-store.js';

const toHostContact = (
  user: Awaited<ReturnType<typeof findAuthUsersByIds>>[number] | undefined
): AdminCommunityHostContactDTO | null =>
  user
    ? {
        id: user._id,
        email: user.email,
        displayName: user.profile.displayName ?? null,
        avatarUrl: user.profile.avatarUrl ?? null,
      }
    : null;

const toListItem = (
  row: CommunityGroupRecord,
  admin: AdminCommunityHostContactDTO | null
): AdminCommunityListItemDTO => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  summary: row.summary,
  bannerUrl: row.bannerUrl,
  visibility: row.visibility,
  joinPolicy: row.joinPolicy,
  geoRef: row.geoRef,
  memberCount: row.memberCount,
  status: row.status,
  adminUserId: row.adminUserId,
  admin,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const listAdminDiscoverableCommunities = async (): Promise<AdminCommunityListItemDTO[]> => {
  const rows = await listAdminCommunityGroups();
  const adminIds = [...new Set(rows.map((row) => row.adminUserId).filter(Boolean))] as string[];
  const users = await findAuthUsersByIds(adminIds);
  const userById = new Map(users.map((user) => [user._id, user]));

  return rows.map((row) =>
    toListItem(row, row.adminUserId ? toHostContact(userById.get(row.adminUserId)) : null)
  );
};

export const loadAdminCommunityDetail = async (communityId: string): Promise<AdminCommunityDetailDTO> => {
  const row = await findCommunityById(communityId);
  if (!row) {
    throw new ApiError(404, 'community_not_found', 'Community not found.');
  }

  const memberRows = await listCommunityGroupMembers(communityId);
  const memberUserIds = [...new Set(memberRows.map((member) => member.userId))];
  const lookupIds = [...new Set([...(row.adminUserId ? [row.adminUserId] : []), ...memberUserIds])];
  const users = await findAuthUsersByIds(lookupIds);
  const userById = new Map(users.map((user) => [user._id, user]));

  const host = row.adminUserId ? toHostContact(userById.get(row.adminUserId)) : null;
  const community = toListItem(row, host);

  const members: AdminCommunityMemberRowDTO[] = memberRows.map((member) => {
    const user = userById.get(member.userId);
    return {
      userId: member.userId,
      email: user?.email ?? '—',
      displayName: user?.profile.displayName ?? null,
      status: member.status,
      joinedAt: member.joinedAt.toISOString(),
    };
  });

  const inviteRows = await listCommunityGroupInvites(communityId);
  const invites: AdminCommunityInviteRowDTO[] = inviteRows.map((invite) => ({
    id: invite.id,
    email: invite.email,
    userId: invite.userId,
    status: invite.status,
    invitedByUserId: invite.invitedByUserId,
    createdAt: invite.createdAt.toISOString(),
    acceptedAt: invite.acceptedAt?.toISOString() ?? null,
  }));

  const pendingCount = members.filter((member) => member.status === 'pending').length;
  const memberCount = members.filter((member) => member.status === 'member').length;
  const pendingInvites = invites.filter((invite) => invite.status === 'pending').length;

  return {
    community,
    host,
    members,
    invites,
    stats: { memberCount, pendingCount, pendingInvites },
  };
};