import { findAuthUsersByIds } from './auth-users-store.js';
import { normalizeSearchRegexInput } from './regex-search.js';
import {
  groupsCollection,
  invitesCollection,
  mapGroup,
  membersCollection,
  wallCollection,
  wallReactionsCollection,
} from './social-groups-store-internals.js';
import type { GroupType } from './social-groups-store-types.js';
import { listGroupInvites, listGroupMembersDetailed } from './social-groups-membership-store.js';

const findGroupById = async (groupId: string) => {
  const row = await groupsCollection().findOne({ _id: groupId });
  return row ? mapGroup(row) : null;
};

export const countSocialGroups = async (): Promise<number> => groupsCollection().countDocuments();

export const listAllSocialGroupsAdmin = async (input: {
  skip: number;
  take: number;
  search?: string;
  type?: GroupType;
  status?: 'active' | 'suspended';
}) => {
  const filter: Record<string, unknown> = {};
  if (input.type) filter.type = input.type;
  if (input.status) filter.status = input.status;
  const searchRegex = normalizeSearchRegexInput(input.search);
  if (searchRegex) {
    filter.$or = [
      { name: { $regex: searchRegex, $options: 'i' } },
      { slogan: { $regex: searchRegex, $options: 'i' } },
    ];
  }

  const [rows, total] = await Promise.all([
    groupsCollection().find(filter).sort({ createdAt: -1 }).skip(input.skip).limit(input.take).toArray(),
    groupsCollection().countDocuments(filter),
  ]);

  if (rows.length === 0) {
    return { data: [], total };
  }

  const groupIds = rows.map((row) => row._id);
  const memberCounts = await membersCollection()
    .aggregate<{ _id: string; count: number; adultCount: number }>([
      { $match: { groupId: { $in: groupIds } } },
      {
        $group: {
          _id: '$groupId',
          count: { $sum: 1 },
          adultCount: { $sum: { $cond: [{ $eq: ['$memberType', 'adult'] }, 1, 0] } },
        },
      },
    ])
    .toArray();
  const countMap = new Map(memberCounts.map((entry) => [entry._id, entry]));

  const adminUserIds = [...new Set(rows.map((row) => row.adminUserId))];
  const users = await findAuthUsersByIds(adminUserIds);
  const userMap = new Map(users.map((user) => [user._id, user]));

  const data = rows.map((row) => {
    const group = mapGroup(row);
    const counts = countMap.get(row._id);
    const admin = userMap.get(row.adminUserId);
    return {
      ...group,
      memberCount: counts?.count ?? 0,
      adultMemberCount: counts?.adultCount ?? 0,
      admin: admin
        ? {
            id: admin._id,
            email: admin.email,
            displayName: admin.profile.displayName ?? null,
            avatarUrl: admin.profile.avatarUrl ?? null,
          }
        : null,
    };
  });

  return { data, total };
};

export const getSocialGroupAdminDetail = async (groupId: string) => {
  const group = await findGroupById(groupId);
  if (!group) return null;

  const [members, invites, adminUsers] = await Promise.all([
    listGroupMembersDetailed(groupId),
    listGroupInvites(groupId),
    findAuthUsersByIds([group.adminUserId]),
  ]);

  const admin = adminUsers[0] ?? null;
  return {
    group,
    admin: admin
      ? {
          id: admin._id,
          email: admin.email,
          displayName: admin.profile.displayName ?? null,
          avatarUrl: admin.profile.avatarUrl ?? null,
        }
      : null,
    members,
    invites: invites.map(({ token: _token, ...invite }) => invite),
    stats: {
      memberCount: members.length,
      adultCount: members.filter((member) => member.memberType === 'adult').length,
      kidCount: members.filter((member) => member.memberType === 'kid').length,
      pendingInvites: invites.filter((invite) => invite.status === 'pending').length,
    },
  };
};

export const deleteSocialGroup = async (groupId: string): Promise<{ deleted: boolean }> => {
  const group = await findGroupById(groupId);
  if (!group) return { deleted: false };

  await Promise.all([
    membersCollection().deleteMany({ groupId }),
    invitesCollection().deleteMany({ groupId }),
    wallCollection().deleteMany({ groupId }),
    wallReactionsCollection().deleteMany({ groupId }),
    groupsCollection().deleteOne({ _id: groupId }),
  ]);

  return { deleted: true };
};