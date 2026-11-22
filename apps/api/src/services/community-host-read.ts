import type { CommunityHostAdminRowDTO, CommunityHostManageDTO } from '@uaetrail/shared-types';
import { findAuthUsersByIds } from '../lib/auth-users-store.js';
import { listCommunityGroupAdmins } from '../lib/community-group-admins-store.js';
import { listCommunityGroupInvites } from '../lib/community-group-invites-store.js';
import { listCommunityGroupMembers } from '../lib/community-group-members-store.js';
import { assertCommunityAdministrator, resolveCommunityHostAdminRole } from './community-host-access.js';

export const loadCommunityHostManageSurface = async (
  hostUserId: string,
  communityId: string
): Promise<CommunityHostManageDTO> => {
  const community = await assertCommunityAdministrator(communityId, hostUserId);

  const memberRows = await listCommunityGroupMembers(communityId);
  const adminRows = await listCommunityGroupAdmins(communityId);
  const adminUserIds = new Set(adminRows.map((row) => row.userId));
  if (community.adminUserId) adminUserIds.add(community.adminUserId);

  const users = await findAuthUsersByIds([...new Set([...memberRows.map((row) => row.userId), ...adminUserIds])]);
  const userById = new Map(users.map((user) => [user._id, user]));

  const toMemberRow = (member: (typeof memberRows)[number]) => {
    const user = userById.get(member.userId);
    return {
      userId: member.userId,
      email: user?.email ?? '—',
      displayName: user?.profile.displayName ?? null,
      status: member.status,
      joinedAt: member.joinedAt.toISOString(),
    };
  };

  const members = memberRows.filter((row) => row.status === 'member').map(toMemberRow);
  const pending = memberRows.filter((row) => row.status === 'pending').map(toMemberRow);
  const invites = await listCommunityGroupInvites(communityId);
  const pendingInvites = invites.filter((invite) => invite.status === 'pending').length;

  const admins: CommunityHostAdminRowDTO[] = [];
  if (community.adminUserId) {
    const owner = userById.get(community.adminUserId);
    admins.push({
      userId: community.adminUserId,
      email: owner?.email ?? '—',
      displayName: owner?.profile.displayName ?? null,
      role: 'owner',
    });
  }
  for (const adminRow of adminRows) {
    if (adminRow.role !== 'admin') continue;
    if (adminRow.userId === community.adminUserId) continue;
    const user = userById.get(adminRow.userId);
    admins.push({
      userId: adminRow.userId,
      email: user?.email ?? '—',
      displayName: user?.profile.displayName ?? null,
      role: 'admin',
    });
  }

  const viewerAdminRole = await resolveCommunityHostAdminRole(community, hostUserId);

  return {
    communityId,
    slug: community.slug,
    name: community.name,
    joinPolicy: community.joinPolicy,
    status: community.status,
    viewerAdminRole,
    pending,
    members,
    admins,
    pendingInvites,
  };
};