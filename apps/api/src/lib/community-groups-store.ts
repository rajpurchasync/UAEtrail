import type { Collection } from 'mongodb';
import type {
  CommunityDiscoverVisibility,
  CommunityJoinPolicy,
  GeoRef,
} from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { newEntityId } from './entity-builders.js';
import { getMongoClient } from './mongo.js';
import { listCommunityIdsCoAdministeredByUser } from './community-group-admins-store.js';

export type CommunityGroupStatus = 'active' | 'suspended';

export type CommunityGroupRecord = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  policies: string | null;
  bannerUrl: string | null;
  visibility: CommunityDiscoverVisibility;
  joinPolicy: CommunityJoinPolicy;
  geoRef: GeoRef;
  /** Community host for platform ops contact — not private Teams admin. */
  adminUserId: string | null;
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
  return {
    ...rest,
    id: _id,
    adminUserId: rest.adminUserId ?? null,
    description: rest.description ?? null,
    policies: rest.policies ?? null,
  };
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

export const listCommunityGroupsHostedByUser = async (adminUserId: string): Promise<CommunityGroupRecord[]> => {
  const cursor = collection().find({ adminUserId }, { sort: { createdAt: -1 } });
  const docs = await cursor.toArray();
  return docs.map(toRecord);
};

/** Owner rows plus communities where user is a co-admin. */
export const listCommunityGroupsManagedByUser = async (userId: string): Promise<CommunityGroupRecord[]> => {
  const ownedDocs = await collection().find({ adminUserId: userId }).sort({ createdAt: -1 }).toArray();
  const ownedIds = new Set(ownedDocs.map((doc) => doc._id));
  const coAdminIds = (await listCommunityIdsCoAdministeredByUser(userId)).filter((id) => !ownedIds.has(id));
  const coDocs = coAdminIds.length
    ? await collection()
        .find({ _id: { $in: coAdminIds } })
        .sort({ createdAt: -1 })
        .toArray()
    : [];
  return [...ownedDocs, ...coDocs].map(toRecord);
};

export const findCommunityBySlug = async (slug: string): Promise<CommunityGroupRecord | null> => {
  const doc = await collection().findOne({ slug });
  return doc ? toRecord(doc) : null;
};

export const listAdminCommunityGroups = async (): Promise<CommunityGroupRecord[]> => {
  const cursor = collection().find({}, { sort: { 'geoRef.names.country': 1, name: 1 } });
  const docs = await cursor.toArray();
  return docs.map(toRecord);
};

export const updateCommunityGroupStatus = async (
  id: string,
  status: CommunityGroupStatus
): Promise<boolean> => {
  const result = await collection().updateOne({ _id: id }, { $set: { status, updatedAt: new Date() } });
  return result.matchedCount > 0;
};

export const patchCommunityGroupProfile = async (
  id: string,
  patch: {
    summary?: string | null;
    description?: string | null;
    policies?: string | null;
    bannerUrl?: string | null;
  }
): Promise<CommunityGroupRecord | null> => {
  const $set: Record<string, unknown> = { updatedAt: new Date() };
  if ('summary' in patch) $set.summary = patch.summary ?? null;
  if ('description' in patch) $set.description = patch.description ?? null;
  if ('policies' in patch) $set.policies = patch.policies ?? null;
  if ('bannerUrl' in patch) $set.bannerUrl = patch.bannerUrl ?? null;
  const updated = await collection().findOneAndUpdate({ _id: id }, { $set }, { returnDocument: 'after' });
  return updated ? toRecord(updated) : null;
};

export const insertCommunityGroup = async (input: {
  name: string;
  slug: string;
  summary: string | null;
  description?: string | null;
  policies?: string | null;
  bannerUrl: string | null;
  visibility: CommunityDiscoverVisibility;
  joinPolicy: CommunityJoinPolicy;
  geoRef: GeoRef;
  adminUserId?: string | null;
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
    description: input.description ?? null,
    policies: input.policies ?? null,
    bannerUrl: input.bannerUrl,
    visibility: input.visibility,
    joinPolicy: input.joinPolicy,
    geoRef: input.geoRef,
    adminUserId: input.adminUserId ?? null,
    status: input.status ?? 'active',
    memberCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await collection().insertOne(doc);
  return toRecord(doc);
};