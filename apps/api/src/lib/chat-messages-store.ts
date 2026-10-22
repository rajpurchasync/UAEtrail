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
  replyToMessageId?: string | null;
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
  replyToMessageId: msg.replyToMessageId ?? null,
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

const threadMatch = (currentUserId: string, partnerId: string) => ({
  $or: [
    { senderId: currentUserId, receiverId: partnerId },
    { senderId: partnerId, receiverId: currentUserId },
  ],
});

export const listThreadMessages = async (input: {
  currentUserId: string;
  partnerId: string;
  skip: number;
  take: number;
}): Promise<ChatMessage[]> => {
  const rows = await chatMessagesCollection()
    .find(threadMatch(input.currentUserId, input.partnerId))
    .sort({ createdAt: -1 })
    .skip(input.skip)
    .limit(input.take)
    .toArray();

  return rows.map(mapMessage);
};

/** Latest messages in chronological order (oldest → newest within the batch). */
export const listThreadMessagesLatest = async (input: {
  currentUserId: string;
  partnerId: string;
  take: number;
}): Promise<ChatMessage[]> => {
  const rows = await chatMessagesCollection()
    .find(threadMatch(input.currentUserId, input.partnerId))
    .sort({ createdAt: -1 })
    .limit(input.take)
    .toArray();

  return rows.map(mapMessage).reverse();
};

/** Messages older than `beforeMessageId`, chronological order. */
export const listThreadMessagesBefore = async (input: {
  currentUserId: string;
  partnerId: string;
  beforeMessageId: string;
  take: number;
}): Promise<ChatMessage[]> => {
  const anchor = await chatMessagesCollection().findOne({ _id: input.beforeMessageId });
  if (!anchor) return [];

  const inThread =
    (anchor.senderId === input.currentUserId && anchor.receiverId === input.partnerId) ||
    (anchor.senderId === input.partnerId && anchor.receiverId === input.currentUserId);
  if (!inThread) return [];

  const rows = await chatMessagesCollection()
    .find({
      $and: [
        threadMatch(input.currentUserId, input.partnerId),
        {
          $or: [
            { createdAt: { $lt: anchor.createdAt } },
            { createdAt: anchor.createdAt, _id: { $lt: anchor._id } },
          ],
        },
      ],
    })
    .sort({ createdAt: -1, _id: -1 })
    .limit(input.take)
    .toArray();

  return rows.map(mapMessage).reverse();
};

export const findChatMessageInThread = async (
  messageId: string,
  userA: string,
  userB: string
): Promise<ChatMessage | null> => {
  const row = await chatMessagesCollection().findOne({ _id: messageId });
  if (!row) return null;
  const inThread =
    (row.senderId === userA && row.receiverId === userB) ||
    (row.senderId === userB && row.receiverId === userA);
  if (!inThread) return null;
  return mapMessage(row);
};

export const findChatMessagesByIds = async (messageIds: string[]): Promise<ChatMessage[]> => {
  if (messageIds.length === 0) return [];
  const rows = await chatMessagesCollection().find({ _id: { $in: messageIds } }).toArray();
  return rows.map(mapMessage);
};

export const createChatMessageRecord = async (input: {
  senderId: string;
  receiverId: string;
  content: string;
  activityId?: string | null;
  replyToMessageId?: string | null;
}): Promise<ChatMessage> => {
  const doc: MongoChatMessage = {
    _id: randomUUID(),
    senderId: input.senderId,
    receiverId: input.receiverId,
    content: input.content,
    activityId: input.activityId ?? null,
    replyToMessageId: input.replyToMessageId ?? null,
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
