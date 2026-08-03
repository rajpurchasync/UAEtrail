import { randomUUID } from 'crypto';
import type { Collection } from 'mongodb';
import { getMongoClient } from './mongo.js';

export type PushSubscriptionRecord = {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type MongoPushSubscription = {
  _id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: Date;
  updatedAt: Date;
};

const subscriptionsCollection = (): Collection<MongoPushSubscription> =>
  getMongoClient()!.db().collection<MongoPushSubscription>('push_subscriptions');

const mapMongoSubscription = (item: MongoPushSubscription): PushSubscriptionRecord => ({
  id: item._id,
  userId: item.userId,
  endpoint: item.endpoint,
  p256dh: item.p256dh,
  auth: item.auth
});

export const upsertPushSubscription = async (input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<PushSubscriptionRecord> => {
  await subscriptionsCollection().updateOne(
    { userId: input.userId, endpoint: input.endpoint },
    {
      $set: {
        p256dh: input.p256dh,
        auth: input.auth,
        updatedAt: new Date()
      },
      $setOnInsert: {
        _id: randomUUID(),
        createdAt: new Date()
      }
    },
    { upsert: true }
  );

  const record = await subscriptionsCollection().findOne({ userId: input.userId, endpoint: input.endpoint });
  if (!record) {
    throw new Error('Failed to persist push subscription.');
  }
  return mapMongoSubscription(record);
};

export const listPushSubscriptions = async (userId: string): Promise<PushSubscriptionRecord[]> => {
  const items = await subscriptionsCollection().find({ userId }).toArray();
  return items.map(mapMongoSubscription);
};

export const countPushSubscriptions = async (userId: string): Promise<number> => {
  return subscriptionsCollection().countDocuments({ userId });
};

export const removePushSubscription = async (input: {
  userId: string;
  endpoint: string;
}): Promise<void> => {
  await subscriptionsCollection().deleteMany({ userId: input.userId, endpoint: input.endpoint });
};

export const removePushSubscriptionById = async (id: string): Promise<void> => {
  await subscriptionsCollection().deleteOne({ _id: id });
};

export const deletePushSubscriptionsByUser = async (userId: string): Promise<void> => {
  await subscriptionsCollection().deleteMany({ userId });
};
