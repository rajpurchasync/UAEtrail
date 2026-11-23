import type {
  CommunityDiscoverDetailDTO,
  MeCreateCommunityDiscoverDTO,
  MeCommunityDiscoverListDTO,
} from '@uaetrail/shared-types';
import { slugifyCommunityDiscoverName } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { insertCommunityMember } from '../lib/community-group-members-store.js';
import { findCommunityBySlug, incrementCommunityMemberCount, insertCommunityGroup } from '../lib/community-groups-store.js';
import { loadExploreCommunityDiscoverDetail } from './community-discover-read.js';
import { loadMeCommunityDiscoverList } from './me-community-discover-read.js';
import { seedCommunityOwnerAdmin } from './community-host-access.js';

export const createMeDiscoverableCommunity = async (
  userId: string,
  email: string,
  input: MeCreateCommunityDiscoverDTO
): Promise<{ list: MeCommunityDiscoverListDTO; detail: CommunityDiscoverDetailDTO }> => {
  const slug = (input.slug?.trim().toLowerCase() || slugifyCommunityDiscoverName(input.name));
  if (!/^[a-z0-9-]{2,120}$/.test(slug)) {
    throw new ApiError(400, 'community_slug_invalid', 'Community slug is invalid.');
  }

  const taken = await findCommunityBySlug(slug);
  if (taken) {
    throw new ApiError(409, 'community_slug_taken', 'That community URL is already taken.');
  }

  let row;
  try {
    row = await insertCommunityGroup({
      name: input.name.trim(),
      slug,
      summary: input.summary ?? null,
      bannerUrl: input.bannerUrl ?? null,
      visibility: input.visibility,
      joinPolicy: input.joinPolicy,
      geoRef: input.geoRef,
      adminUserId: userId,
      status: 'active',
    });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 11000) {
      throw new ApiError(409, 'community_slug_taken', 'That community URL is already taken.');
    }
    throw error;
  }

  await seedCommunityOwnerAdmin(row.id, userId);
  await insertCommunityMember({ communityId: row.id, userId, status: 'member' });
  await incrementCommunityMemberCount(row.id, 1);

  const [list, detail] = await Promise.all([
    loadMeCommunityDiscoverList(userId),
    loadExploreCommunityDiscoverDetail(row.slug, { userId, email }),
  ]);

  return { list, detail };
};