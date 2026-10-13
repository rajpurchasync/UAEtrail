import { useState } from 'react';
import type { SocialGroupWallMessageView } from '../../api/types';
import { messagingApi } from '../../messaging';
import type { GroupWallReactionKind } from '../../constants/groupReactions';
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
  const [reactionBusy, setReactionBusy] = useState(false);

  const reactions = message.reactions ?? [];
  const activeKinds = new Set(reactions.map((reaction) => reaction.kind));

  const toggleReaction = async (kind: GroupWallReactionKind) => {
    setReactionBusy(true);
    try {
      const res = await messagingApi.crew.toggleReaction(groupId, message.id, kind);
      onReactionsChange(message.id, res.data.reactions);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not update reaction.');
    } finally {
      setReactionBusy(false);
    }
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
        reactions={{
          activeKinds,
          disabled: reactionBusy,
          onPick: (kind) => void toggleReaction(kind),
        }}
      />
      <ChatMessageReactionRow
        isMe={isMe}
        reactions={reactions}
        reactionBusy={reactionBusy}
        onToggle={(kind) => void toggleReaction(kind)}
      />
    </div>
  );
};
