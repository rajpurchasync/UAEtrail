import {
  compareCommunityDiscoverByGeo,
  type CommunityDiscoverCardDTO,
} from '@uaetrail/shared-types';
import { listDiscoverableCommunityGroups } from '../lib/community-groups-store.js';

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