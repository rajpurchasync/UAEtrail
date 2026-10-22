import type { SocialGroupWallMessageView } from '../../api/types';
import { messagingApi } from '../../messaging';
import type { GroupWallReactionKind } from '../../constants/groupReactions';
import { applyOptimisticReactionToggle, isOptimisticChatId } from '../../utils/chatOptimistic';
import { ChatMessageBubble, ChatMessageReactionRow } from './ChatMessageBubble';
import { messagesGroupPath } from '../../config/routingCatalog';
import { CHAT_BUBBLE_SHELL_CLASS } from './chatMessageLayout';
import type { GroupWallReplyTarget } from '../../utils/groupWallReply';

export type { GroupWallReplyTarget } from '../../utils/groupWallReply';

type GroupWallMessageItemProps = {
  groupId: string;
  message: SocialGroupWallMessageView;
  isMe: boolean;
  highlighted?: boolean;
  replyEnabled?: boolean;
  onReactionsChange: (messageId: string, reactions: SocialGroupWallMessageView['reactions']) => void;
  onReply: (target: GroupWallReplyTarget) => void;
  onScrollToQuotedMessage?: (messageId: string) => void;
  resolveQuotedMessage?: (messageId: string) => Pick<GroupWallReplyTarget, 'authorName' | 'body'> | null;
  onError: (message: string) => void;
};

export const GroupWallMessageItem = ({
  groupId,
  message,
  isMe,
  onReactionsChange,
  onReply,
  onScrollToQuotedMessage,
  resolveQuotedMessage,
  onError,
  highlighted = false,
  replyEnabled = true,
}: GroupWallMessageItemProps) => {
  const reactions = message.reactions ?? [];
  const activeKinds = new Set(reactions.map((reaction) => reaction.kind));

  const reactionsEnabled = !isOptimisticChatId(message.id);

  const toggleReaction = (kind: GroupWallReactionKind) => {
    if (!reactionsEnabled) return;
    const previous = reactions;
    onReactionsChange(message.id, applyOptimisticReactionToggle(reactions, kind));
    void messagingApi.crew
      .toggleReaction(groupId, message.id, kind)
      .then((res) => onReactionsChange(message.id, res.data.reactions))
      .catch((err) => {
        onReactionsChange(message.id, previous);
        onError(err instanceof Error ? err.message : 'Could not update reaction.');
      });
  };

  const authorName = message.author?.displayName?.trim() || 'Member';
  const chatReturnTo = messagesGroupPath(groupId);

  return (
    <div className={`flex flex-col gap-0 ${CHAT_BUBBLE_SHELL_CLASS}`}>
      <ChatMessageBubble
        messageId={message.id}
        selectorAttr="data-wall-message-id"
        isMe={isMe}
        groupSender={
          !isMe
            ? {
                displayName: authorName,
                userId: message.authorUserId,
                chatReturnTo,
              }
            : undefined
        }
        body={message.body}
        createdAt={message.createdAt}
        highlighted={highlighted}
        replyEnabled={replyEnabled}
        replyToMessageId={message.replyToMessageId}
        replyToPreview={message.replyToPreview}
        resolveQuotedMessage={resolveQuotedMessage}
        onScrollToQuotedMessage={onScrollToQuotedMessage}
        onReply={onReply}
        reactions={
          reactionsEnabled
            ? {
                activeKinds,
                onPick: (kind) => toggleReaction(kind),
              }
            : undefined
        }
      />
      <ChatMessageReactionRow
        isMe={isMe}
        reactions={reactions}
        onToggle={(kind) => toggleReaction(kind)}
      />
    </div>
  );
};
