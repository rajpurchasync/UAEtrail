import type { Collection } from 'mongodb';
import { newEntityId } from './entity-builders.js';
import { getMongoClient } from './mongo.js';
import { COLLECTIONS } from './collections.js';

export type ActivityInviteStatus = 'pending' | 'dismissed';

type ActivityInviteDoc = {
  _id: string;
  activityId: string;
  fromUserId: string;
  toUserId: string;
  status: ActivityInviteStatus;
  createdAt: Date;
  updatedAt: Date;
};

const collection = (): Collection<ActivityInviteDoc> =>
  getMongoClient()!.db().collection<ActivityInviteDoc>(COLLECTIONS.ACTIVITY_INVITES);

export const upsertActivityInvite = async (input: {
  activityId: string;
  fromUserId: string;
  toUserId: string;
}): Promise<ActivityInviteDoc> => {
  const now = new Date();
  const existing = await collection().findOne({
    activityId: input.activityId,
    fromUserId: input.fromUserId,
    toUserId: input.toUserId,
    status: 'pending',
  });
  if (existing) return existing;

  const doc: ActivityInviteDoc = {
    _id: newEntityId(),
    activityId: input.activityId,
    fromUserId: input.fromUserId,
    toUserId: input.toUserId,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  await collection().insertOne(doc);
  return doc;
};

export const purgeActivityInvitesForUser = async (userId: string): Promise<void> => {
  await collection().deleteMany({
    $or: [{ fromUserId: userId }, { toUserId: userId }],
  });
};
