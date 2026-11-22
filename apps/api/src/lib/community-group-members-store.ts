import type { Collection } from 'mongodb';
import type { CommunityMembershipStatus } from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { newEntityId } from './entity-builders.js';
import { getMongoClient } from './mongo.js';

export type CommunityGroupMemberRecord = {
  id: string;
  communityId: string;
  userId: string;
  status: CommunityMembershipStatus;
  joinedAt: Date;
};

type CommunityGroupMemberDoc = CommunityGroupMemberRecord & { _id: string };

const collection = (): Collection<CommunityGroupMemberDoc> =>
  getMongoClient().db().collection(COLLECTIONS.COMMUNITY_GROUP_MEMBERS);

const toRecord = (doc: CommunityGroupMemberDoc): CommunityGroupMemberRecord => {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id };
};

export const findCommunityMembership = async (
  communityId: string,
  userId: string
): Promise<CommunityGroupMemberRecord | null> => {
  const doc = await collection().findOne({ communityId, userId });
  return doc ? toRecord(doc) : null;
};

export const insertCommunityMember = async (input: {
  communityId: string;
  userId: string;
  status: CommunityMembershipStatus;
}): Promise<CommunityGroupMemberRecord> => {
  const now = new Date();
  const id = newEntityId();
  const doc: CommunityGroupMemberDoc = {
    _id: id,
    id,
    communityId: input.communityId,
    userId: input.userId,
    status: input.status,
    joinedAt: now,
  };
  await collection().insertOne(doc);
  return toRecord(doc);
};