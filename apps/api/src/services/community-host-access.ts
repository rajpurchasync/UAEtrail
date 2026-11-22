import { findCommunityById, type CommunityGroupRecord } from '../lib/community-groups-store.js';
import {
  findCommunityGroupAdmin,
  insertCommunityGroupAdmin,
  listCommunityGroupAdmins,
} from '../lib/community-group-admins-store.js';
import { ApiError } from '../lib/api-error.js';

/** Owner (`adminUserId`) or co-admin row. */
export const isCommunityAdministrator = async (communityId: string, userId: string): Promise<boolean> => {
  const community = await findCommunityById(communityId);
  if (!community) return false;
  if (community.adminUserId === userId) return true;
  const row = await findCommunityGroupAdmin(communityId, userId);
  return Boolean(row);
};

export const assertCommunityAdministrator = async (
  communityId: string,
  userId: string
): Promise<CommunityGroupRecord> => {
  const community = await findCommunityById(communityId);
  if (!community) {
    throw new ApiError(404, 'community_not_found', 'Community not found.');
  }
  const allowed = await isCommunityAdministrator(communityId, userId);
  if (!allowed) {
    throw new ApiError(403, 'community_host_required', 'Only the community host can manage this community.');
  }
  return community;
};

export const seedCommunityOwnerAdmin = async (communityId: string, ownerUserId: string): Promise<void> => {
  const existing = await findCommunityGroupAdmin(communityId, ownerUserId);
  if (existing) return;
  const admins = await listCommunityGroupAdmins(communityId);
  if (admins.some((row) => row.role === 'owner')) return;
  await insertCommunityGroupAdmin({ communityId, userId: ownerUserId, role: 'owner' });
};

export const listCommunityAdministratorUserIds = async (communityId: string): Promise<string[]> => {
  const community = await findCommunityById(communityId);
  if (!community) return [];
  const rows = await listCommunityGroupAdmins(communityId);
  const ids = new Set<string>();
  if (community.adminUserId) ids.add(community.adminUserId);
  for (const row of rows) {
    if (row.role === 'admin') ids.add(row.userId);
  }
  return [...ids];
};

export const resolveCommunityHostAdminRole = async (
  community: CommunityGroupRecord,
  userId: string
): Promise<'owner' | 'admin' | null> => {
  if (community.adminUserId === userId) return 'owner';
  const row = await findCommunityGroupAdmin(community.id, userId);
  return row?.role === 'admin' ? 'admin' : null;
};