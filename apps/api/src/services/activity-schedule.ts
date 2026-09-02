import { NotificationType } from '../domain/enums.js';
import { formatActivityLocal } from '../lib/datetime.js';
import { dispatchNotification } from './notifications.js';

export const scheduleInstantChanged = (
  previous: Date,
  next: Date | undefined,
  countryCode: string
): boolean => {
  if (!next) return false;
  const prev = formatActivityLocal(previous, countryCode);
  const updated = formatActivityLocal(next, countryCode);
  return prev.date !== updated.date || prev.time !== updated.time;
};

export const formatScheduleLabel = (instant: Date, countryCode: string): string => {
  const { date, time } = formatActivityLocal(instant, countryCode);
  return `${date} at ${time}`;
};

export async function notifyParticipantsOfScheduleChange(params: {
  activityId: string;
  activityTitle: string;
  participantUserIds: string[];
  previousStartAt: Date;
  newStartAt: Date;
  countryCode: string;
}): Promise<void> {
  const { activityId, activityTitle, participantUserIds, previousStartAt, newStartAt, countryCode } = params;
  if (participantUserIds.length === 0) return;

  const was = formatScheduleLabel(previousStartAt, countryCode);
  const now = formatScheduleLabel(newStartAt, countryCode);
  const title = 'Trip rescheduled';
  const body = `"${activityTitle}" has a new date/time: ${now} (was ${was}).`;

  await Promise.all(
    participantUserIds.map((userId) =>
      dispatchNotification({
        userId,
        title,
        body,
        type: NotificationType.ACTIVITY,
        meta: { activityId, kind: 'schedule_change', previousStartAt: previousStartAt.toISOString(), newStartAt: newStartAt.toISOString() }
      })
    )
  );
}
