import type { CommunityDiscoverCardDTO } from '@uaetrail/shared-types';
import { listAdminCommunityGroups } from '../lib/community-groups-store.js';

const toCard = (row: Awaited<ReturnType<typeof listAdminCommunityGroups>>[number]): CommunityDiscoverCardDTO => ({
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

export const listAdminDiscoverableCommunities = async (): Promise<CommunityDiscoverCardDTO[]> => {
  const rows = await listAdminCommunityGroups();
  return rows.map(toCard);
};