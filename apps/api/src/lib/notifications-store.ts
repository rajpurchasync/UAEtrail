import { randomUUID } from 'crypto';
import { NotificationType } from '../domain/enums.js';
import type { Collection } from 'mongodb';
import { getMongoClient } from './mongo.js';

export type NotificationRecord = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  meta: unknown;
  createdAt: Date;
};

type MongoNotification = {
  _id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  meta: unknown;
  createdAt: Date;
};

const notificationsCollection = (): Collection<MongoNotification> =>
  getMongoClient()!.db().collection<MongoNotification>('notifications');

const mapNotification = (item: MongoNotification): NotificationRecord => ({
  id: item._id,
  userId: item.userId,
  title: item.title,
  body: item.body,
  type: item.type,
  isRead: item.isRead,
  meta: item.meta,
  createdAt: item.createdAt
});

export const createNotificationRecord = async (input: {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  meta?: unknown;
}): Promise<NotificationRecord> => {
  const doc: MongoNotification = {
    _id: randomUUID(),
    userId: input.userId,
    title: input.title,
    body: input.body,
    type: input.type,
    isRead: false,
    meta: input.meta ?? null,
    createdAt: new Date()
  };
  await notificationsCollection().insertOne(doc);
  return mapNotification(doc);
};

export const createNotificationsMany = async (rows: Array<{
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  meta?: unknown;
}>): Promise<number> => {
  if (rows.length === 0) return 0;

  await notificationsCollection().insertMany(
    rows.map((row) => ({
      _id: randomUUID(),
      userId: row.userId,
      title: row.title,
      body: row.body,
      type: row.type,
      isRead: false,
      meta: row.meta ?? null,
      createdAt: new Date()
    }))
  );
  return rows.length;
};

export const listUserNotifications = async (input: {
  userId: string;
  skip: number;
  take: number;
}): Promise<{ items: NotificationRecord[]; total: number; unreadCount: number }> => {
  const where = { userId: input.userId };

  const [items, total, unreadCount] = await Promise.all([
    notificationsCollection().find(where).sort({ createdAt: -1 }).skip(input.skip).limit(input.take).toArray(),
    notificationsCollection().countDocuments(where),
    notificationsCollection().countDocuments({ ...where, isRead: false })
  ]);

  return {
    items: items.map(mapNotification),
    total,
    unreadCount
  };
};

export const markNotificationAsRead = async (input: {
  id: string;
  userId: string;
}): Promise<number> => {
  const result = await notificationsCollection().updateMany(
    { _id: input.id, userId: input.userId, isRead: false },
    { $set: { isRead: true } }
  );
  return result.modifiedCount;
};

export const markAllNotificationsAsRead = async (userId: string): Promise<number> => {
  const result = await notificationsCollection().updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } }
  );
  return result.modifiedCount;
};

export const deleteNotificationsByUser = async (userId: string): Promise<void> => {
  await notificationsCollection().deleteMany({ userId });
};
