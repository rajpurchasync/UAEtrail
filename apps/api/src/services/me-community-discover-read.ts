import type { MeCommunityDiscoverListDTO, MeCommunityDiscoverRowDTO } from '@uaetrail/shared-types';
import { listCommunityMembershipsForUser } from '../lib/community-group-members-store.js';
import {
  findCommunityById,
  listCommunityGroupsManagedByUser,
  type CommunityGroupRecord,
} from '../lib/community-groups-store.js';

const toRow = (
  community: CommunityGroupRecord,
  relation: MeCommunityDiscoverRowDTO['relation'],
  membershipStatus: MeCommunityDiscoverRowDTO['membershipStatus']
): MeCommunityDiscoverRowDTO => ({
  id: community.id,
  name: community.name,
  slug: community.slug,
  summary: community.summary,
  bannerUrl: community.bannerUrl,
  visibility: community.visibility,
  joinPolicy: community.joinPolicy,
  geoRef: community.geoRef,
  memberCount: community.memberCount,
  membershipStatus,
  relation,
});

export const loadMeCommunityDiscoverList = async (userId: string): Promise<MeCommunityDiscoverListDTO> => {
  const [hostedRows, memberships] = await Promise.all([
    listCommunityGroupsManagedByUser(userId),
    listCommunityMembershipsForUser(userId),
  ]);

  const hostedById = new Map(hostedRows.map((row) => [row.id, row]));
  const created: MeCommunityDiscoverRowDTO[] = hostedRows.map((row) =>
    toRow(row, 'host', 'member')
  );

  const joined: MeCommunityDiscoverRowDTO[] = [];
  for (const membership of memberships) {
    if (hostedById.has(membership.communityId)) continue;
    const community = await findCommunityById(membership.communityId);
    if (!community || community.status !== 'active') continue;
    const relation = membership.status === 'pending' ? 'pending' : 'member';
    joined.push(toRow(community, relation, membership.status));
  }

  return { created, joined };
};