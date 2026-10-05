import type { ActivityDTO } from '@uaetrail/shared-types';
import type { NavigateFunction } from 'react-router-dom';
import type { HostActivityCtaHandlers } from '../components/activity/HostActivityCtas';
import { openActivityGroupChat } from '../utils/openActivityGroupChat';
import { navigateToHostedActivityManage } from './navigateHostedActivityManage';
import { navigateToReorganizeActivity } from '../explore/navigateReorganizeActivity';

type HostActivityCtaHandlersArgs = {
  activity: ActivityDTO | null | undefined;
  navigate: NavigateFunction;
  onInviteActivity?: (activity: ActivityDTO, options?: { canSendBuddyInvites?: boolean }) => void;
  onCreateLinkedRideshare?: (parent: ActivityDTO) => void;
  onRequestDelete: (activity: ActivityDTO) => void;
  onBeforeNavigate?: () => void;
  onChatError?: (message: string) => void;
};

export const hostActivityCtaHandlers = ({
  activity,
  navigate,
  onInviteActivity,
  onCreateLinkedRideshare,
  onRequestDelete,
  onBeforeNavigate,
  onChatError,
}: HostActivityCtaHandlersArgs): HostActivityCtaHandlers | null => {
  if (!activity) return null;

  return {
    onChat: () => {
      onBeforeNavigate?.();
      void openActivityGroupChat(navigate, activity.id, activity.groupChatId).catch((err) => {
        onChatError?.(err instanceof Error ? err.message : 'Could not open activity chat.');
      });
    },
    onViewParticipants: () => {
      onBeforeNavigate?.();
      navigateToHostedActivityManage(navigate, activity.id, 'checkin');
    },
    onInvite: () => {
      if (activity.status !== 'published') return;
      onInviteActivity?.(activity, { canSendBuddyInvites: true });
    },
    onAddCarpool: onCreateLinkedRideshare
      ? () => {
          onBeforeNavigate?.();
          onCreateLinkedRideshare(activity);
        }
      : undefined,
    onDelete: () => onRequestDelete(activity),
    onDuplicate: () => {
      onBeforeNavigate?.();
      navigateToReorganizeActivity(navigate, activity);
    },
  };
};
