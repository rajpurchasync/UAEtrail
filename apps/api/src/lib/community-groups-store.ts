import type { Collection } from 'mongodb';
import type {
  CommunityDiscoverVisibility,
  CommunityJoinPolicy,
  GeoRef,
} from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { newEntityId } from './entity-builders.js';
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

export const findPublicCommunityBySlug = async (slug: string): Promise<CommunityGroupRecord | null> => {
  const doc = await collection().findOne({ slug, status: 'active', visibility: 'public' });
  return doc ? toRecord(doc) : null;
};

export const findPublicCommunityById = async (id: string): Promise<CommunityGroupRecord | null> => {
  const doc = await collection().findOne({ _id: id, status: 'active', visibility: 'public' });
  return doc ? toRecord(doc) : null;
};

export const incrementCommunityMemberCount = async (communityId: string, delta: number): Promise<void> => {
  await collection().updateOne({ _id: communityId }, { $inc: { memberCount: delta } });
};

export const findCommunityById = async (id: string): Promise<CommunityGroupRecord | null> => {
  const doc = await collection().findOne({ _id: id });
  return doc ? toRecord(doc) : null;
};

export const listAdminCommunityGroups = async (): Promise<CommunityGroupRecord[]> => {
  const cursor = collection().find({}, { sort: { 'geoRef.names.country': 1, name: 1 } });
  const docs = await cursor.toArray();
  return docs.map(toRecord);
};

export const insertCommunityGroup = async (input: {
  name: string;
  slug: string;
  summary: string | null;
  bannerUrl: string | null;
  visibility: CommunityDiscoverVisibility;
  joinPolicy: CommunityJoinPolicy;
  geoRef: GeoRef;
  status?: CommunityGroupStatus;
}): Promise<CommunityGroupRecord> => {
  const now = new Date();
  const id = newEntityId();
  const doc: CommunityGroupDoc = {
    _id: id,
    id,
    name: input.name,
    slug: input.slug,
    summary: input.summary,
    bannerUrl: input.bannerUrl,
    visibility: input.visibility,
    joinPolicy: input.joinPolicy,
    geoRef: input.geoRef,
    status: input.status ?? 'active',
    memberCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await collection().insertOne(doc);
  return toRecord(doc);
};