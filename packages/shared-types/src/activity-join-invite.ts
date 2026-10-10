/** Rolling window for Join me invite caps (interim — WHOS_GOING_UX §8). */
export const ACTIVITY_JOIN_INVITE_WINDOW_MS = 86_400_000;

/** Max distinct Join me sends per activity per sender per window (anti-spam). */
export const ACTIVITY_JOIN_INVITE_DAILY_LIMIT_PER_ACTIVITY = 20;

/** Pending Join me invites the caller sent for one activity. */
export type ActivityJoinInvitesSentDTO = {
  inviteeUserIds: string[];
};

/** Pending Join me invite for the signed-in viewer on activity detail. */
export type ActivityJoinInviteForViewerDTO = {
  fromUserId: string;
  inviterDisplayName: string;
};

/** Inbox row for Plan “Needs you” and notifications — pending friend Join me invite. */
export type PendingActivityJoinInviteDTO = {
  activityId: string;
  activityTitle: string;
  fromUserId: string;
  inviterDisplayName: string;
};
