import {
  compareCommunityDiscoverByGeo,
  type CommunityDiscoverCardDTO,
  type CommunityDiscoverDetailDTO,
} from '@uaetrail/shared-types';
import { findCommunityMembership } from '../lib/community-group-members-store.js';
import {
  findPublicCommunityBySlug,
  listDiscoverableCommunityGroups,
} from '../lib/community-groups-store.js';
import { ApiError } from '../lib/api-error.js';

const toCard = (row: Awaited<ReturnType<typeof listDiscoverableCommunityGroups>>[number]): CommunityDiscoverCardDTO => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  summary: row.summary,
  bannerUrl: row.bannerUrl,
  visibility: row.visibility,
  joinPolicy: row.joinPolicy,
  geoRef: row.geoRef,
  memberCount: row.memberCount,
});

/** `GET /explore/communities` — sorted country → city (client may re-sort with shared helper). */
export const loadExploreCommunityDiscoverList = async (): Promise<CommunityDiscoverCardDTO[]> => {
  const rows = await listDiscoverableCommunityGroups();
  return rows.map(toCard).sort(compareCommunityDiscoverByGeo);
};

/** `GET /explore/communities/:slug` — optional signed-in viewer membership. */
export const loadExploreCommunityDiscoverDetail = async (
  slug: string,
  viewerUserId: string | null
): Promise<CommunityDiscoverDetailDTO> => {
  const row = await findPublicCommunityBySlug(slug);
  if (!row) {
    throw new ApiError(404, 'community_not_found', 'Community not found.');
  }
  const card = toCard(row);
  if (!viewerUserId) {
    return { ...card, viewerMembership: null };
  }
  const membership = await findCommunityMembership(row.id, viewerUserId);
  return {
    ...card,
    viewerMembership: membership ? { status: membership.status } : null,
  };
};