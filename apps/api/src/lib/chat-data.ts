import { randomUUID } from 'crypto';
import type { ChatMessage } from '../domain/types.js';
import type { Collection } from 'mongodb';
import { getMongoClient } from './mongo.js';

type MongoChatMessage = {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  activityId: string | null;
  readAt: Date | null;
  createdAt: Date;
};

const chatMessagesCollection = (): Collection<MongoChatMessage> =>
  getMongoClient()!.db().collection<MongoChatMessage>('chat_messages');

const mapMessage = (msg: MongoChatMessage): ChatMessage => ({
  id: msg._id,
  senderId: msg.senderId,
  receiverId: msg.receiverId,
  content: msg.content,
  activityId: msg.activityId,
  readAt: msg.readAt,
  createdAt: msg.createdAt
});

export const listConversationPartnerIds = async (userId: string): Promise<string[]> => {
  const rows = await chatMessagesCollection()
    .aggregate<{ _id: string }>([
      { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
      {
        $project: {
          partnerId: {
            $cond: [{ $eq: ['$senderId', userId] }, '$receiverId', '$senderId']
          }
        }
      },
      { $group: { _id: '$partnerId' } }
    ])
    .toArray();

  return rows.map((row) => row._id);
};

export const getUnreadCountByPartner = async (userId: string, partnerIds: string[]): Promise<Map<string, number>> => {
  if (partnerIds.length === 0) return new Map();

  const rows = await chatMessagesCollection()
    .aggregate<{ _id: string; count: number }>([
      {
        $match: {
          receiverId: userId,
          senderId: { $in: partnerIds },
          readAt: null
        }
      },
      { $group: { _id: '$senderId', count: { $sum: 1 } } }
    ])
    .toArray();

  return new Map(rows.map((row) => [row._id, row.count]));
};

export const getLastMessageByPartner = async (
  userId: string,
  partnerIds: string[]
): Promise<Map<string, { content: string; createdAt: Date } | null>> => {
  if (partnerIds.length === 0) return new Map();

  const rows = await chatMessagesCollection()
    .aggregate<{ _id: string; content: string; createdAt: Date }>([
      {
        $match: {
          $or: [
            { senderId: userId, receiverId: { $in: partnerIds } },
            { senderId: { $in: partnerIds }, receiverId: userId }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$senderId', userId] }, '$receiverId', '$senderId']
          },
          content: { $first: '$content' },
          createdAt: { $first: '$createdAt' }
        }
      }
    ])
    .toArray();

  const map = new Map<string, { content: string; createdAt: Date } | null>();
  partnerIds.forEach((id) => map.set(id, null));
  rows.forEach((row) => map.set(row._id, { content: row.content, createdAt: row.createdAt }));
  return map;
};

export const markThreadAsRead = async (currentUserId: string, partnerId: string): Promise<void> => {
  await chatMessagesCollection().updateMany(
    { senderId: partnerId, receiverId: currentUserId, readAt: null },
    { $set: { readAt: new Date() } }
  );
};

export const countThreadMessages = async (currentUserId: string, partnerId: string): Promise<number> => {
  return chatMessagesCollection().countDocuments({
    $or: [
      { senderId: currentUserId, receiverId: partnerId },
      { senderId: partnerId, receiverId: currentUserId }
    ]
  });
};

export const listThreadMessages = async (input: {
  currentUserId: string;
  partnerId: string;
  skip: number;
  take: number;
}): Promise<ChatMessage[]> => {
  const rows = await chatMessagesCollection()
    .find({
      $or: [
        { senderId: input.currentUserId, receiverId: input.partnerId },
        { senderId: input.partnerId, receiverId: input.currentUserId }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(input.skip)
    .limit(input.take)
    .toArray();

  return rows.map(mapMessage);
};

export const createChatMessageRecord = async (input: {
  senderId: string;
  receiverId: string;
  content: string;
  activityId?: string | null;
}): Promise<ChatMessage> => {
  const doc: MongoChatMessage = {
    _id: randomUUID(),
    senderId: input.senderId,
    receiverId: input.receiverId,
    content: input.content,
    activityId: input.activityId ?? null,
    readAt: null,
    createdAt: new Date()
  };
  await chatMessagesCollection().insertOne(doc);
  return mapMessage(doc);
};

export const countRecentMessagesBySender = async (senderId: string, since: Date): Promise<number> => {
  return chatMessagesCollection().countDocuments({ senderId, createdAt: { $gte: since } });
};

export const hasThreadBetweenUsers = async (firstUserId: string, secondUserId: string): Promise<boolean> => {
  const existingThread = await chatMessagesCollection().findOne(
    {
      $or: [
        { senderId: firstUserId, receiverId: secondUserId },
        { senderId: secondUserId, receiverId: firstUserId }
      ]
    },
    { projection: { _id: 1 } }
  );
  return Boolean(existingThread);
};

/** Remove message content authored by a deleted user. */
export const purgeUserChatMessages = async (userId: string): Promise<void> => {
  await chatMessagesCollection().updateMany(
    { senderId: userId },
    { $set: { content: '[message removed]' } }
  );
};
