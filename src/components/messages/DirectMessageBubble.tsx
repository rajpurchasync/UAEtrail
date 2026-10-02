import type { ChatMessageDTO } from '@uaetrail/shared-types';
import { ChatMessageBubble } from './ChatMessageBubble';
import type { GroupWallReplyTarget } from '../../utils/groupWallReply';

type DirectMessageBubbleProps = {
  message: ChatMessageDTO;
  isMe: boolean;
  partnerDisplayName: string;
  highlighted?: boolean;
  onReply: (target: GroupWallReplyTarget) => void;
  onScrollToQuotedMessage?: (messageId: string) => void;
  resolveQuotedMessage?: (messageId: string) => Pick<GroupWallReplyTarget, 'authorName' | 'body'> | null;
};

export const DirectMessageBubble = ({
  message,
  isMe,
  partnerDisplayName,
  highlighted = false,
  onReply,
  onScrollToQuotedMessage,
  resolveQuotedMessage,
}: DirectMessageBubbleProps) => (
  <ChatMessageBubble
    messageId={message.id}
    selectorAttr="data-dm-message-id"
    isMe={isMe}
    senderLabel={isMe ? undefined : partnerDisplayName}
    body={message.content}
    createdAt={message.createdAt}
    readAt={message.readAt}
    highlighted={highlighted}
    replyEnabled
    replyToMessageId={message.replyToMessageId}
    replyToPreview={message.replyToPreview}
    resolveQuotedMessage={resolveQuotedMessage}
    onScrollToQuotedMessage={onScrollToQuotedMessage}
    onReply={onReply}
  />
);
