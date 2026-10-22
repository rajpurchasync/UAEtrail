import type { SocialGroupView, SocialGroupWallMessageView } from '../../api/types';
import { DirectChatThread, type DirectChatThreadProps } from './DirectChatThread';
import { GroupChatThread, type GroupChatActivityPayload } from './GroupChatThread';

export type { GroupChatActivityPayload };

type GroupChatThreadRouterProps = {
  groupId: string;
  onBack: () => void;
  onGroupActivity?: (payload: GroupChatActivityPayload) => void;
  streamedMessage?: SocialGroupWallMessageView | null;
  onStreamedMessageApplied?: () => void;
  onGroupUpdated?: (group: SocialGroupView) => void;
};

type ChatThreadRouterProps =
  | { mode: 'group'; group: GroupChatThreadRouterProps }
  | { mode: 'direct'; direct: DirectChatThreadProps };

/** Picks direct vs group thread UI from inbox deep link (`?to=` / `?group=`). */
export const ChatThreadRouter = (props: ChatThreadRouterProps) => {
  if (props.mode === 'group') {
    const {
      groupId,
      onBack,
      onGroupActivity,
      streamedMessage,
      onStreamedMessageApplied,
      onGroupUpdated,
    } = props.group;
    return (
      <GroupChatThread
        key={groupId}
        groupId={groupId}
        onBack={onBack}
        onGroupActivity={onGroupActivity}
        streamedMessage={streamedMessage}
        onStreamedMessageApplied={onStreamedMessageApplied}
        onGroupUpdated={onGroupUpdated}
      />
    );
  }

  return <DirectChatThread {...props.direct} />;
};
