import { useState } from 'react';
import type { ChatMessageDTO, ChatMessageReactionDTO } from '@uaetrail/shared-types';
import { messagingApi } from '../../messaging';
import type { GroupWallReactionKind } from '../../constants/groupReactions';
import { ChatMessageBubble, ChatMessageReactionRow } from './ChatMessageBubble';
import { CHAT_BUBBLE_SHELL_CLASS } from './chatMessageLayout';
import type { GroupWallReplyTarget } from '../../utils/groupWallReply';

type DirectMessageBubbleProps = {
  message: ChatMessageDTO;
  isMe: boolean;
  partnerUserId: string;
  partnerDisplayName: string;
  highlighted?: boolean;
  onReactionsChange: (messageId: string, reactions: ChatMessageReactionDTO[]) => void;
  onReply: (target: GroupWallReplyTarget) => void;
  onScrollToQuotedMessage?: (messageId: string) => void;
  resolveQuotedMessage?: (messageId: string) => Pick<GroupWallReplyTarget, 'authorName' | 'body'> | null;
  onError: (message: string) => void;
};

export const DirectMessageBubble = ({
  message,
  isMe,
  partnerUserId,
  partnerDisplayName,
  highlighted = false,
  onReactionsChange,
  onReply,
  onScrollToQuotedMessage,
  resolveQuotedMessage,
  onError,
}: DirectMessageBubbleProps) => {
  const [reactionBusy, setReactionBusy] = useState(false);

  const reactions = message.reactions ?? [];
  const activeKinds = new Set(reactions.map((reaction) => reaction.kind as GroupWallReactionKind));

  const toggleReaction = async (kind: GroupWallReactionKind) => {
    setReactionBusy(true);
    try {
      const res = await messagingApi.direct.toggleReaction(message.id, partnerUserId, kind);
      onReactionsChange(message.id, res.data.reactions);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not update reaction.');
    } finally {
      setReactionBusy(false);
    }
  };

  return (
    <div className={`flex flex-col ${CHAT_BUBBLE_SHELL_CLASS}`}>
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
        reactions={{
          activeKinds,
          disabled: reactionBusy,
          onPick: (kind) => void toggleReaction(kind),
        }}
      />
      <ChatMessageReactionRow
        isMe={isMe}
        reactions={reactions.map((r) => ({
          ...r,
          kind: r.kind as GroupWallReactionKind,
        }))}
        reactionBusy={reactionBusy}
        onToggle={(kind) => void toggleReaction(kind)}
      />
    </div>
  );
};
