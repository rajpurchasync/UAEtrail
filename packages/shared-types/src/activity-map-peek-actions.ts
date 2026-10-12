import type { ActivityJoinMode } from './activity-join-mode.js';
import type { ActivityViewerAccessLevel } from './activity-viewer-access.js';

/** Wire ids for explore map peek actions — UI maps to handlers; not React component names. */
export type ActivityMapPeekActionId =
  | 'open_crew_chat'
  | 'link_rideshare'
  | 'offer_rideshare'
  | 'message_host'
  | 'invite_crew'
  | 'view_detail'
  | 'request_join'
  | 'pending_join'
  | 'share_activity'
  | 'manage_activity'
  | 'withdraw_join';

export type ActivityMapPeekActionProminence = 'primary' | 'secondary' | 'link' | 'text';

export type MapPeekJoinRequestStatus = 'pending' | 'waitlisted';

export type ActivityMapPeekAction = {
  id: ActivityMapPeekActionId;
  prominence: ActivityMapPeekActionProminence;
  /** When `id` is `pending_join` — label for the disabled state. */
  joinRequestStatus?: MapPeekJoinRequestStatus;
};

export type ActivityMapPeekActionsInput = {
  level: ActivityViewerAccessLevel;
  activityPublished: boolean;
  joinMode?: ActivityJoinMode;
  joinRequestStatus?: MapPeekJoinRequestStatus | null;
  confirmedParticipantCount?: number;
};

const joinEligibleLevels: ReadonlySet<ActivityViewerAccessLevel> = new Set(['link_holder']);

/** Map peek actions from viewer access level (explore map surface only). */
export const computeActivityMapPeekActions = (
  input: ActivityMapPeekActionsInput
): ActivityMapPeekAction[] => {
  const { level, activityPublished, joinRequestStatus } = input;

  if (level === 'host' || level === 'platform_admin') {
    const hostHasJoiners = (input.confirmedParticipantCount ?? 0) > 0;
    const actions: ActivityMapPeekAction[] = hostHasJoiners
      ? [
          { id: 'open_crew_chat', prominence: 'primary' },
          { id: 'share_activity', prominence: 'secondary' },
          { id: 'manage_activity', prominence: 'secondary' },
        ]
      : [
          { id: 'share_activity', prominence: 'primary' },
          { id: 'manage_activity', prominence: 'secondary' },
        ];
    if (activityPublished) {
      actions.push({ id: 'link_rideshare', prominence: 'link' });
    }
    actions.push({ id: 'view_detail', prominence: 'text' });
    return actions;
  }

  if (level === 'public') {
    return [
      { id: 'request_join', prominence: 'primary' },
      { id: 'view_detail', prominence: 'text' },
    ];
  }

  if (level === 'tenant_staff') {
    return [{ id: 'view_detail', prominence: 'primary' }];
  }

  if (level === 'join_request') {
    if (joinRequestStatus === 'pending' || joinRequestStatus === 'waitlisted') {
      return [
        { id: 'pending_join', prominence: 'primary', joinRequestStatus },
        { id: 'view_detail', prominence: 'text' },
      ];
    }
    return [
      { id: 'request_join', prominence: 'primary' },
      { id: 'view_detail', prominence: 'text' },
    ];
  }

  if (joinEligibleLevels.has(level)) {
    return [
      { id: 'request_join', prominence: 'primary' },
      { id: 'view_detail', prominence: 'text' },
    ];
  }

  if (level === 'participant' || level === 'activity_group_member') {
    const actions: ActivityMapPeekAction[] = [{ id: 'open_crew_chat', prominence: 'primary' }];
    if (activityPublished) {
      actions.push({ id: 'invite_crew', prominence: 'secondary' });
    }
    actions.push({ id: 'view_detail', prominence: 'text' });
    return actions;
  }

  return [];
};
