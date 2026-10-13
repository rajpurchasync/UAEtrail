import type { ActivityDTO } from '@uaetrail/shared-types';
import type { NavigateFunction } from 'react-router-dom';
import type { HostActivityCtaHandlers } from '../components/activity/HostActivityCtas';
import { openActivityGroupChat } from '../utils/openActivityGroupChat';
import { navigateToPlanHostedActivity } from './navigatePlanHostedActivity';
import { navigateToReorganizeActivity } from '../explore/navigateReorganizeActivity';

type PublishedActivityCtaHandlersArgs = {
  activity: ActivityDTO | null | undefined;
  navigate: NavigateFunction;
  onInviteActivity?: (activity: ActivityDTO, options?: { canSendBuddyInvites?: boolean }) => void;
  onCreateLinkedRideshare?: (parent: ActivityDTO) => void;
  onRequestDelete: (activity: ActivityDTO) => void;
  onBeforeNavigate?: () => void;
  onChatError?: (message: string) => void;
  onViewParticipants?: () => void;
};

export const publishedActivityCtaHandlers = ({
  activity,
  navigate,
  onInviteActivity,
  onCreateLinkedRideshare,
  onRequestDelete,
  onBeforeNavigate,
  onChatError,
  onViewParticipants,
}: PublishedActivityCtaHandlersArgs): HostActivityCtaHandlers | null => {
  if (!activity) return null;

  return {
    onChat: () => {
      onBeforeNavigate?.();
      void openActivityGroupChat(navigate, activity.id, activity.groupChatId).catch((err) => {
        onChatError?.(err instanceof Error ? err.message : 'Could not open activity chat.');
      });
    },
    onViewParticipants: () => {
      if (onViewParticipants) {
        onViewParticipants();
        return;
      }
      onBeforeNavigate?.();
      navigateToPlanHostedActivity(navigate, activity.id, 'checkin');
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

/** @deprecated Use {@link publishedActivityCtaHandlers}. */
export const hostActivityCtaHandlers = publishedActivityCtaHandlers;
