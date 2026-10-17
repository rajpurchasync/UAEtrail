import {
  countThreadMessages,
  findChatMessageInThread,
  listThreadMessages,
  markThreadAsRead,
} from '../lib/chat-data.js';

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
