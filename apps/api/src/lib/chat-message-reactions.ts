import type { Collection } from 'mongodb';
import { getMongoClient } from './mongo.js';
import { COLLECTIONS } from './collections.js';
import { newEntityId } from './entity-builders.js';
import {
  GROUP_WALL_REACTION_KINDS,
  type GroupWallReactionKind,
  type GroupWallReactionSummary,
} from './social-groups-store.js';
import { findChatMessageInThread } from './chat-messages-store.js';

type MongoChatMessageReaction = {
  _id: string;
  messageId: string;
  userId: string;
  kind: GroupWallReactionKind;
  createdAt: Date;
};

const reactionsCollection = (): Collection<MongoChatMessageReaction> =>
  getMongoClient()!.db().collection<MongoChatMessageReaction>(COLLECTIONS.CHAT_MESSAGE_REACTIONS);

const summarizeReactions = (
  rows: MongoChatMessageReaction[],
  viewerUserId: string
): GroupWallReactionSummary[] => {
  const reactions: GroupWallReactionSummary[] = [];
  for (const reaction of rows) {
    const summary = reactions.find((item) => item.kind === reaction.kind);
    if (summary) {
      summary.count += 1;
      if (reaction.userId === viewerUserId) {
        summary.reactedByMe = true;
      }
    } else {
      reactions.push({
        kind: reaction.kind,
        count: 1,
        reactedByMe: reaction.userId === viewerUserId,
      });
    }
  }
  return reactions;
};

export const loadChatMessageReactionsForMessages = async (
  messageIds: string[],
  viewerUserId: string
): Promise<Map<string, GroupWallReactionSummary[]>> => {
  const map = new Map<string, GroupWallReactionSummary[]>();
  if (messageIds.length === 0) return map;

  const rows = await reactionsCollection().find({ messageId: { $in: messageIds } }).toArray();
  const byMessage = new Map<string, MongoChatMessageReaction[]>();
  for (const row of rows) {
    const list = byMessage.get(row.messageId) ?? [];
    list.push(row);
    byMessage.set(row.messageId, list);
  }

  for (const messageId of messageIds) {
    map.set(messageId, summarizeReactions(byMessage.get(messageId) ?? [], viewerUserId));
  }
  return map;
};

export const toggleChatMessageReaction = async (input: {
  messageId: string;
  userId: string;
  partnerUserId: string;
  kind: GroupWallReactionKind;
}): Promise<{ reactions: GroupWallReactionSummary[] }> => {
  if (!GROUP_WALL_REACTION_KINDS.includes(input.kind)) {
    throw new Error('Invalid reaction.');
  }

  const message = await findChatMessageInThread(input.messageId, input.userId, input.partnerUserId);
  if (!message) {
    throw new Error('Message not found.');
  }

  const existing = await reactionsCollection().findOne({
    messageId: input.messageId,
    userId: input.userId,
    kind: input.kind,
  });

  if (existing) {
    await reactionsCollection().deleteOne({ _id: existing._id });
  } else {
    await reactionsCollection().insertOne({
      _id: newEntityId(),
      messageId: input.messageId,
      userId: input.userId,
      kind: input.kind,
      createdAt: new Date(),
    });
  }

  const reactionRows = await reactionsCollection().find({ messageId: input.messageId }).toArray();
  return { reactions: summarizeReactions(reactionRows, input.userId) };
};
