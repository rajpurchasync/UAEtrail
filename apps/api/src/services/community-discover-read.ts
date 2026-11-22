import {
  compareCommunityDiscoverByGeo,
  type CommunityDiscoverCardDTO,
  type CommunityDiscoverDetailDTO,
} from '@uaetrail/shared-types';
import { findCommunityMembership } from '../lib/community-group-members-store.js';
import { findPendingCommunityInviteForUser } from '../lib/community-group-invites-store.js';
import {
  findCommunityBySlug,
  findPublicCommunityBySlug,
  listDiscoverableCommunityGroups,
} from '../lib/community-groups-store.js';
import { ApiError } from '../lib/api-error.js';
import { isCommunityAdministrator } from './community-host-access.js';

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
  viewer: { userId: string; email: string } | null
): Promise<CommunityDiscoverDetailDTO> => {
  let row = await findPublicCommunityBySlug(slug);
  if (!row && viewer) {
    const any = await findCommunityBySlug(slug);
    if (any && (await isCommunityAdministrator(any.id, viewer.userId))) {
      row = any;
    }
  }
  if (!row) {
    throw new ApiError(404, 'community_not_found', 'Community not found.');
  }
  const card = toCard(row);
  if (!viewer) {
    return {
      ...card,
      description: row.description ?? null,
      policies: row.policies ?? null,
      viewerMembership: null,
      viewerHasInvite: false,
      viewerIsHost: false,
      status: row.status,
    };
  }
  const membership = await findCommunityMembership(row.id, viewer.userId);
  let viewerHasInvite = false;
  if (!membership && row.joinPolicy === 'invite') {
    const invite = await findPendingCommunityInviteForUser({
      communityId: row.id,
      userId: viewer.userId,
      email: viewer.email,
    });
    viewerHasInvite = Boolean(invite);
  }
  const viewerIsHost = await isCommunityAdministrator(row.id, viewer.userId);

  return {
    ...card,
    description: row.description ?? null,
    policies: row.policies ?? null,
    viewerMembership: membership ? { status: membership.status } : null,
    viewerHasInvite,
    viewerIsHost,
    status: row.status,
  };
};