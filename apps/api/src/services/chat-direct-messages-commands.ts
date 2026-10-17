import { NotificationType } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { createChatMessageRecord, markThreadAsRead } from '../lib/chat-data.js';
import { presentChatMessageAsDto } from '../lib/chat-message-presenter.js';
import { messagesToUserPath } from '../lib/member-routes.js';
import { scheduleSideEffect } from '../lib/schedule-side-effect.js';
import { assertCanMessageUser, assertChatRateLimit } from './chat-policy.js';
import { publishChatStreamEvent } from './chat-stream.js';
import { findAuthUserById } from './member-identity-read.js';
import { findChatMessageInThread } from './chat-direct-messages-read.js';
import { scheduleNotification } from './notifications.js';

export { createChatMessageRecord, markThreadAsRead };

export const sendDirectChatMessage = async (input: {
  senderId: string;
  receiverId: string;
  content: string;
  activityId?: string;
  replyToMessageId?: string;
}) => {
  if (input.senderId === input.receiverId) {
    throw new ApiError(400, 'self_message', 'Cannot message yourself.');
  }

  await assertChatRateLimit(input.senderId);
  await assertCanMessageUser(input.senderId, input.receiverId, { activityId: input.activityId });

  const receiver = await findAuthUserById(input.receiverId);
  if (!receiver) {
    throw new ApiError(404, 'user_not_found', 'Recipient not found.');
  }

  const trimmedReplyId = input.replyToMessageId?.trim() || null;
  if (trimmedReplyId) {
    const parent = await findChatMessageInThread(trimmedReplyId, input.senderId, input.receiverId);
    if (!parent) {
      throw new ApiError(400, 'invalid_reply', 'Reply target is not in this conversation.');
    }
  }

  const message = await createChatMessageRecord({
    senderId: input.senderId,
    receiverId: input.receiverId,
    content: input.content,
    activityId: input.activityId ?? null,
    replyToMessageId: trimmedReplyId,
  });

  const messageDto = await presentChatMessageAsDto(message, input.senderId);
  void publishChatStreamEvent(input.receiverId, { type: 'chat_message', data: messageDto });

  scheduleSideEffect(
    findAuthUserById(input.senderId).then((sender) => {
      const senderName = sender?.profile.displayName ?? sender?.email ?? 'Someone';
      scheduleNotification(
        {
          userId: input.receiverId,
          title: 'New message',
          body: `${senderName}: ${input.content.substring(0, 100)}`,
          type: NotificationType.SYSTEM,
          meta: {
            kind: 'message',
            chatMessageId: message.id,
            actorUserId: input.senderId,
            path: messagesToUserPath(input.senderId),
          },
        },
        'chat.direct_message'
      );
    }),
    'chat.direct_message_lookup'
  );

  return messageDto;
};
