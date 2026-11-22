import type { Collection } from 'mongodb';
import type {
  CommunityDiscoverVisibility,
  CommunityJoinPolicy,
  GeoRef,
} from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { getMongoClient } from './mongo.js';

export type CommunityGroupStatus = 'active' | 'suspended';

export type CommunityGroupRecord = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  bannerUrl: string | null;
  visibility: CommunityDiscoverVisibility;
  joinPolicy: CommunityJoinPolicy;
  geoRef: GeoRef;
  status: CommunityGroupStatus;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
};

type CommunityGroupDoc = CommunityGroupRecord & { _id: string };

const collection = (): Collection<CommunityGroupDoc> =>
  getMongoClient().db().collection(COLLECTIONS.COMMUNITY_GROUPS);

const toRecord = (doc: CommunityGroupDoc): CommunityGroupRecord => {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id };
};

/** Public discover directory — `visibility: public` + `status: active` only. */
export const listDiscoverableCommunityGroups = async (): Promise<CommunityGroupRecord[]> => {
  const cursor = collection().find(
    { status: 'active', visibility: 'public' },
    { sort: { 'geoRef.names.country': 1, 'geoRef.names.area': 1, name: 1 } }
  );
  const docs = await cursor.toArray();
  return docs.map(toRecord);
};