import { ActivityType } from '../domain/enums.js';
import type { Activity } from '../domain/types.js';

const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  [ActivityType.HIKING]: 'hiking trip',
  [ActivityType.CAMPING]: 'camping trip',
  [ActivityType.EVENT]: 'group outing',
  [ActivityType.RIDESHARE]: 'rideshare',
};

export const activityJoinInviteTypeLabel = (activityType: ActivityType | string | undefined): string => {
  const key = String(activityType ?? ActivityType.EVENT).toUpperCase();
  return ACTIVITY_TYPE_LABEL[key] ?? 'outing';
};

export const formatActivityJoinInviteDateLabel = (startAt: Date | string | undefined | null): string | null => {
  if (!startAt) return null;
  const date = startAt instanceof Date ? startAt : new Date(startAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Dubai',
  });
};

export const buildActivityJoinInviteNotificationCopy = (input: {
  inviterDisplayName: string;
  activity: Pick<Activity, 'title' | 'activityType' | 'startAt'> | null;
}): { title: string; body: string } => {
  const inviter = input.inviterDisplayName.trim() || 'A friend';
  const typeLabel = activityJoinInviteTypeLabel(input.activity?.activityType ?? undefined);
  const dateLabel = formatActivityJoinInviteDateLabel(input.activity?.startAt ?? null);
  const whenPart = dateLabel ? ` on ${dateLabel}` : '';
  return {
    title: 'Join me outside',
    body: `${inviter} invited you to join a ${typeLabel}${whenPart}. Tap to view and join.`,
  };
};
