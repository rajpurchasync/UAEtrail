import type { ChatMessageDTO, GroupWallReplyPreviewDTO } from '@uaetrail/shared-types';
import type { ChatMessage } from '../domain/types.js';
import { findAuthUsersByIds } from './auth-users.js';
import { findChatMessagesByIds } from './chat-data.js';
import { buildGroupWallReplyPreview } from './reply-preview.js';

const displayNameForUser = (
  user: Awaited<ReturnType<typeof findAuthUsersByIds>>[number] | undefined
) => user?.profile.displayName ?? user?.email.split('@')[0] ?? 'Member';

export const presentChatMessagesAsDtos = async (messages: ChatMessage[]): Promise<ChatMessageDTO[]> => {
  if (messages.length === 0) return [];

  const replyParentIds = [
    ...new Set(
      messages.map((m) => m.replyToMessageId?.trim()).filter((id): id is string => Boolean(id))
    ),
  ];
  const parents = replyParentIds.length > 0 ? await findChatMessagesByIds(replyParentIds) : [];
  const parentById = new Map(parents.map((m) => [m.id, m]));

  const userIds = [
    ...new Set([
      ...messages.flatMap((m) => [m.senderId, m.receiverId]),
      ...parents.flatMap((m) => [m.senderId, m.receiverId]),
    ]),
  ];
  const users = await findAuthUsersByIds(userIds);
  const userMap = new Map(users.map((u) => [u._id, u]));

  const previewFor = (replyId: string | null): GroupWallReplyPreviewDTO | undefined => {
    if (!replyId) return undefined;
    const parent = parentById.get(replyId);
    if (!parent) return undefined;
    const authorId = parent.senderId;
    return buildGroupWallReplyPreview(
      replyId,
      displayNameForUser(userMap.get(authorId)),
      parent.content
    );
  };

  return messages.map((message) => {
    const replyId = message.replyToMessageId?.trim() || undefined;
    const replyToPreview = replyId ? previewFor(replyId) : undefined;
    return {
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      activityId: message.activityId ?? undefined,
      replyToMessageId: replyId,
      replyToPreview,
      readAt: message.readAt?.toISOString() ?? undefined,
      createdAt: message.createdAt.toISOString(),
    };
  });
};

export const presentChatMessageAsDto = async (message: ChatMessage): Promise<ChatMessageDTO> => {
  const [dto] = await presentChatMessagesAsDtos([message]);
  return dto;
};
