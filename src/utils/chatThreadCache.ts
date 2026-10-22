import type { ChatMessageDTO } from '@uaetrail/shared-types';
import type { SocialGroupWallMessageView } from '../api/types';
import { isOptimisticChatId } from './chatOptimistic';

export const sortChatRowsChronological = <T extends { createdAt: string }>(rows: T[]): T[] =>
  [...rows].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

export const mergeChatRowsById = <T extends { id: string; createdAt: string }>(
  current: T[],
  incoming: T[]
): T[] => {
  const map = new Map<string, T>();
  for (const row of current) map.set(row.id, row);
  for (const row of incoming) map.set(row.id, row);
  return sortChatRowsChronological([...map.values()]);
};

export type DirectChatThreadCache = {
  messages: ChatMessageDTO[];
  hasMoreOlder: boolean;
};

export type GroupChatWallCache = {
  messages: SocialGroupWallMessageView[];
  hasMoreOlder: boolean;
};

export const directMessagesMatchThread = (
  rows: ChatMessageDTO[],
  viewerId: string,
  partnerId: string
): boolean => {
  if (rows.length === 0) return true;
  return rows.every((message) => {
    if (isOptimisticChatId(message.id)) {
      return message.senderId === viewerId && message.receiverId === partnerId;
    }
    return (
      (message.senderId === viewerId && message.receiverId === partnerId) ||
      (message.senderId === partnerId && message.receiverId === viewerId)
    );
  });
};

export const groupWallMessagesMatchGroup = (
  rows: SocialGroupWallMessageView[],
  groupId: string
): boolean => {
  if (rows.length === 0) return true;
  return rows.every((message) => {
    if (isOptimisticChatId(message.id)) {
      return message.groupId === groupId;
    }
    return message.groupId === groupId;
  });
};
