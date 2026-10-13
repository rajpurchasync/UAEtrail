import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';

/** Every `ActivityMapPeekActionId` must have an explicit branch (AD-LIST-08 / peek–list parity). */
export const ACTIVITY_MAP_PEEK_ACTION_IDS: ActivityMapPeekActionId[] = [
  'open_crew_chat',
  'link_rideshare',
  'offer_rideshare',
  'message_host',
  'invite_crew',
  'view_detail',
  'request_join',
  'pending_join',
  'share_activity',
  'manage_activity',
  'withdraw_join',
];

export type ActivityMapPeekActionHandlers = {
  openCrewChat?: () => void;
  linkRideshare?: () => void;
  offerRideshare?: () => void;
  messageHost?: () => void;
  inviteCrew?: () => void;
  viewDetail?: () => void;
  requestJoin?: () => void;
  shareActivity?: () => void;
  manageActivity?: () => void;
  withdrawJoin?: () => void;
};

/**
 * Map wire peek / list-feed action id → UI side effects.
 * Callers supply handlers (join state, navigation, sheets stay local).
 */
export const executeActivityMapPeekAction = (
  actionId: ActivityMapPeekActionId,
  handlers: ActivityMapPeekActionHandlers
): void => {
  switch (actionId) {
    case 'pending_join':
      return;
    case 'open_crew_chat':
      handlers.openCrewChat?.();
      return;
    case 'link_rideshare':
      handlers.linkRideshare?.();
      return;
    case 'offer_rideshare':
      handlers.offerRideshare?.();
      return;
    case 'message_host':
      handlers.messageHost?.();
      return;
    case 'invite_crew':
      handlers.inviteCrew?.();
      return;
    case 'view_detail':
      handlers.viewDetail?.();
      return;
    case 'request_join':
      handlers.requestJoin?.();
      return;
    case 'share_activity':
      handlers.shareActivity?.();
      return;
    case 'manage_activity':
      handlers.manageActivity?.();
      return;
    case 'withdraw_join':
      handlers.withdrawJoin?.();
      return;
    default: {
      const _exhaustive: never = actionId;
      return _exhaustive;
    }
  }
};
