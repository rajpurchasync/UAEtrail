import {
  countThreadMessages,
  findChatMessageInThread,
  listThreadMessages,
  listThreadMessagesBefore,
  listThreadMessagesLatest,
  markThreadAsRead,
} from '../lib/chat-messages-store.js';

export { countThreadMessages, findChatMessageInThread, listThreadMessages };

export const loadDirectMessageThread = async (input: {
  currentUserId: string;
  partnerId: string;
  page: number;
  pageSize: number;
}) => {
  await markThreadAsRead(input.currentUserId, input.partnerId);
  const skip = (input.page - 1) * input.pageSize;
  const [total, messages] = await Promise.all([
    countThreadMessages(input.currentUserId, input.partnerId),
    listThreadMessages({
      currentUserId: input.currentUserId,
      partnerId: input.partnerId,
      skip,
      take: input.pageSize,
    }),
  ]);
  return { total, messages };
};

export const loadDirectMessageLatest = async (input: {
  currentUserId: string;
  partnerId: string;
  limit: number;
}) => {
  await markThreadAsRead(input.currentUserId, input.partnerId);
  const [total, messages] = await Promise.all([
    countThreadMessages(input.currentUserId, input.partnerId),
    listThreadMessagesLatest({
      currentUserId: input.currentUserId,
      partnerId: input.partnerId,
      take: input.limit,
    }),
  ]);
  const hasMoreOlder = total > messages.length;
  return { messages, hasMoreOlder, total };
};

export const loadDirectMessageOlder = async (input: {
  currentUserId: string;
  partnerId: string;
  beforeMessageId: string;
  limit: number;
}) => {
  const messages = await listThreadMessagesBefore({
    currentUserId: input.currentUserId,
    partnerId: input.partnerId,
    beforeMessageId: input.beforeMessageId,
    take: input.limit,
  });
  const hasMoreOlder = messages.length === input.limit;
  return { messages, hasMoreOlder };
};
