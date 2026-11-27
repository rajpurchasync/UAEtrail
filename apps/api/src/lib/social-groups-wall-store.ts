import { buildGroupWallReplyPreview } from './reply-preview.js';
import { newEntityId } from './entity-builders.js';
import { findAuthUsersByIds } from './auth-users-store.js';
import {
  displayNameForUser,
  mapWall,
  wallCollection,
  wallReactionsCollection,
} from './social-groups-store-internals.js';
import type {
  GroupWallMessageRecord,
  GroupWallReactionSummary,
  ListGroupWallMessagesOptions,
  ListGroupWallMessagesResult,
  PresentedGroupWallMessage,
} from './social-groups-store-types.js';
import type { GroupWallReactionKind } from '../domain/group-wall-reactions.js';

export type {
  GroupWallMessageRecord,
  GroupWallReactionSummary,
  ListGroupWallMessagesOptions,
  ListGroupWallMessagesResult,
  PresentedGroupWallMessage,
};

const presentGroupWallMessages = async (
  groupId: string,
  messages: GroupWallMessageRecord[],
  viewerUserId?: string
): Promise<PresentedGroupWallMessage[]> => {
  if (messages.length === 0) return [];

  const replyParentIds = [
    ...new Set(
      messages.map((m) => m.replyToMessageId?.trim()).filter((id): id is string => Boolean(id))
    ),
  ];
  const parentRows =
    replyParentIds.length > 0
      ? await wallCollection().find({ groupId, _id: { $in: replyParentIds } }).toArray()
      : [];
  const parentById = new Map(parentRows.map((row) => [row._id, mapWall(row)]));

  const authorIds = [
    ...new Set([
      ...messages.map((m) => m.authorUserId),
      ...parentRows.map((row) => row.authorUserId),
    ]),
  ];
  const users = await findAuthUsersByIds(authorIds);
  const userMap = new Map(users.map((u) => [u._id, u]));

  const messageIds = messages.map((message) => message.id);
  const reactionRows = await wallReactionsCollection()
    .find({ groupId, messageId: { $in: messageIds } })
    .toArray();

  const reactionsByMessage = new Map<string, GroupWallReactionSummary[]>();
  for (const reaction of reactionRows) {
    const existing = reactionsByMessage.get(reaction.messageId) ?? [];
    const summary = existing.find((item) => item.kind === reaction.kind);
    if (summary) {
      summary.count += 1;
      if (viewerUserId && reaction.userId === viewerUserId) {
        summary.reactedByMe = true;
      }
    } else {
      existing.push({
        kind: reaction.kind,
        count: 1,
        reactedByMe: Boolean(viewerUserId && reaction.userId === viewerUserId),
      });
    }
    reactionsByMessage.set(reaction.messageId, existing);
  }

  return messages.map((message) => {
    const user = userMap.get(message.authorUserId);
    const replyId = message.replyToMessageId?.trim() || null;
    const parent = replyId ? parentById.get(replyId) : undefined;
    const parentUser = parent ? userMap.get(parent.authorUserId) : undefined;
    const replyToPreview =
      replyId && parent
        ? buildGroupWallReplyPreview(replyId, displayNameForUser(parentUser), parent.body)
        : null;

    return {
      ...message,
      author: {
        id: message.authorUserId,
        displayName: displayNameForUser(user),
        avatarUrl: user?.profile.avatarUrl ?? null,
      },
      reactions: reactionsByMessage.get(message.id) ?? [],
      replyToPreview,
    };
  });
};

export const listGroupWallMessages = async (
  groupId: string,
  options: ListGroupWallMessagesOptions = {}
): Promise<ListGroupWallMessagesResult> => {
  const limit = options.limit ?? 100;
  const viewerUserId = options.viewerUserId;

  if (options.since && options.beforeMessageId) {
    throw new Error('wall_list_since_before_conflict');
  }

  if (options.since) {
    const rows = await wallCollection()
      .find({ groupId, createdAt: { $gt: options.since } })
      .sort({ createdAt: 1 })
      .limit(limit)
      .toArray();
    const messages = rows.map(mapWall);
    const presented = await presentGroupWallMessages(groupId, messages, viewerUserId);
    return { messages: presented, hasMoreOlder: false };
  }

  if (options.beforeMessageId) {
    const anchor = await wallCollection().findOne({ _id: options.beforeMessageId, groupId });
    if (!anchor) {
      return { messages: [], hasMoreOlder: false };
    }
    const rows = await wallCollection()
      .find({
        groupId,
        $or: [
          { createdAt: { $lt: anchor.createdAt } },
          { createdAt: anchor.createdAt, _id: { $lt: anchor._id } },
        ],
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();
    const messages = rows.map(mapWall).reverse();
    const presented = await presentGroupWallMessages(groupId, messages, viewerUserId);
    return { messages: presented, hasMoreOlder: rows.length === limit };
  }

  const rows = await wallCollection().find({ groupId }).sort({ createdAt: -1 }).limit(limit).toArray();
  const messages = rows.map(mapWall).reverse();
  const presented = await presentGroupWallMessages(groupId, messages, viewerUserId);
  return { messages: presented, hasMoreOlder: rows.length === limit };
};

export const presentGroupWallMessage = async (
  groupId: string,
  message: GroupWallMessageRecord,
  viewerUserId?: string
) => {
  const [presented] = await presentGroupWallMessages(groupId, [message], viewerUserId);
  return presented;
};

export const createGroupWallMessage = async (input: {
  groupId: string;
  authorUserId: string;
  body: string;
  replyToMessageId?: string | null;
}): Promise<GroupWallMessageRecord> => {
  const replyToMessageId = input.replyToMessageId?.trim() || null;
  if (replyToMessageId) {
    const parent = await wallCollection().findOne({ _id: replyToMessageId, groupId: input.groupId });
    if (!parent) {
      throw new Error('reply_not_found');
    }
  }

  const doc = {
    _id: newEntityId(),
    groupId: input.groupId,
    authorUserId: input.authorUserId,
    body: input.body.trim(),
    replyToMessageId,
    createdAt: new Date(),
  };
  await wallCollection().insertOne(doc);
  return { ...mapWall(doc), reactions: [] };
};

export const toggleGroupWallReaction = async (input: {
  groupId: string;
  messageId: string;
  userId: string;
  kind: GroupWallReactionKind;
}): Promise<{ reactions: GroupWallReactionSummary[] }> => {
  const message = await wallCollection().findOne({ _id: input.messageId, groupId: input.groupId });
  if (!message) {
    throw new Error('Message not found.');
  }

  const existing = await wallReactionsCollection().findOne({
    messageId: input.messageId,
    userId: input.userId,
    kind: input.kind,
  });

  if (existing) {
    await wallReactionsCollection().deleteOne({ _id: existing._id });
  } else {
    await wallReactionsCollection().insertOne({
      _id: newEntityId(),
      groupId: input.groupId,
      messageId: input.messageId,
      userId: input.userId,
      kind: input.kind,
      createdAt: new Date(),
    });
  }

  const reactionRows = await wallReactionsCollection().find({ messageId: input.messageId }).toArray();
  const reactions: GroupWallReactionSummary[] = [];
  for (const reaction of reactionRows) {
    const summary = reactions.find((item) => item.kind === reaction.kind);
    if (summary) {
      summary.count += 1;
      if (reaction.userId === input.userId) {
        summary.reactedByMe = true;
      }
    } else {
      reactions.push({
        kind: reaction.kind,
        count: 1,
        reactedByMe: reaction.userId === input.userId,
      });
    }
  }

  return { reactions };
};