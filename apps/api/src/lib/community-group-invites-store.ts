import type { Collection } from 'mongodb';
import type { CommunityInviteStatus } from '@uaetrail/shared-types';
import { COLLECTIONS } from './collections.js';
import { newEntityId } from './entity-builders.js';
import { getMongoClient } from './mongo.js';

export type CommunityGroupInviteRecord = {
  id: string;
  communityId: string;
  email: string;
  userId: string | null;
  status: CommunityInviteStatus;
  invitedByUserId: string;
  createdAt: Date;
  acceptedAt: Date | null;
};

type CommunityGroupInviteDoc = CommunityGroupInviteRecord & { _id: string };

const collection = (): Collection<CommunityGroupInviteDoc> =>
  getMongoClient().db().collection(COLLECTIONS.COMMUNITY_GROUP_INVITES);

const toRecord = (doc: CommunityGroupInviteDoc): CommunityGroupInviteRecord => {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id };
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const insertCommunityGroupInvite = async (input: {
  communityId: string;
  email: string;
  userId?: string | null;
  invitedByUserId: string;
}): Promise<CommunityGroupInviteRecord> => {
  const now = new Date();
  const id = newEntityId();
  const doc: CommunityGroupInviteDoc = {
    _id: id,
    id,
    communityId: input.communityId,
    email: normalizeEmail(input.email),
    userId: input.userId ?? null,
    status: 'pending',
    invitedByUserId: input.invitedByUserId,
    createdAt: now,
    acceptedAt: null,
  };
  await collection().insertOne(doc);
  return toRecord(doc);
};

export const listCommunityGroupInvites = async (
  communityId: string
): Promise<CommunityGroupInviteRecord[]> => {
  const cursor = collection().find({ communityId }, { sort: { createdAt: -1 } });
  const docs = await cursor.toArray();
  return docs.map(toRecord);
};

export const findPendingCommunityInviteForUser = async (input: {
  communityId: string;
  userId: string;
  email: string;
}): Promise<CommunityGroupInviteRecord | null> => {
  const email = normalizeEmail(input.email);
  const doc = await collection().findOne({
    communityId: input.communityId,
    status: 'pending',
    $or: [{ userId: input.userId }, { email }],
  });
  return doc ? toRecord(doc) : null;
};

export const markCommunityInviteAccepted = async (inviteId: string): Promise<void> => {
  await collection().updateOne(
    { _id: inviteId, status: 'pending' },
    { $set: { status: 'accepted', acceptedAt: new Date() } }
  );
};