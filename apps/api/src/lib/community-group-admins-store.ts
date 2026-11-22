import type { Collection } from 'mongodb';
import { COLLECTIONS } from './collections.js';
import { newEntityId } from './entity-builders.js';
import { getMongoClient } from './mongo.js';

export type CommunityGroupAdminRole = 'owner' | 'admin';

export type CommunityGroupAdminRecord = {
  id: string;
  communityId: string;
  userId: string;
  role: CommunityGroupAdminRole;
  createdAt: Date;
};

type CommunityGroupAdminDoc = CommunityGroupAdminRecord & { _id: string };

const collection = (): Collection<CommunityGroupAdminDoc> =>
  getMongoClient().db().collection(COLLECTIONS.COMMUNITY_GROUP_ADMINS);

const toRecord = (doc: CommunityGroupAdminDoc): CommunityGroupAdminRecord => {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id };
};

export const insertCommunityGroupAdmin = async (input: {
  communityId: string;
  userId: string;
  role: CommunityGroupAdminRole;
}): Promise<CommunityGroupAdminRecord> => {
  const now = new Date();
  const id = newEntityId();
  const doc: CommunityGroupAdminDoc = {
    _id: id,
    id,
    communityId: input.communityId,
    userId: input.userId,
    role: input.role,
    createdAt: now,
  };
  await collection().insertOne(doc);
  return toRecord(doc);
};

export const listCommunityGroupAdmins = async (communityId: string): Promise<CommunityGroupAdminRecord[]> => {
  const docs = await collection().find({ communityId }).sort({ createdAt: 1 }).toArray();
  return docs.map(toRecord);
};

export const findCommunityGroupAdmin = async (
  communityId: string,
  userId: string
): Promise<CommunityGroupAdminRecord | null> => {
  const doc = await collection().findOne({ communityId, userId });
  return doc ? toRecord(doc) : null;
};

export const deleteCommunityGroupAdmin = async (communityId: string, userId: string): Promise<boolean> => {
  const result = await collection().deleteOne({ communityId, userId, role: 'admin' });
  return result.deletedCount > 0;
};

export const listCommunityIdsCoAdministeredByUser = async (userId: string): Promise<string[]> => {
  const docs = await collection().find({ userId, role: 'admin' }).project({ communityId: 1 }).toArray();
  return docs.map((doc) => doc.communityId);
};