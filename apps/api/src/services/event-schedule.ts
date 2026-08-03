import { NotificationType } from '../domain/enums.js';
import { formatEventLocal } from '../lib/datetime.js';
import { dispatchNotification } from './notifications.js';

export const scheduleInstantChanged = (
  previous: Date,
  next: Date | undefined,
  countryCode: string
): boolean => {
  if (!next) return false;
  const prev = formatEventLocal(previous, countryCode);
  const updated = formatEventLocal(next, countryCode);
  return prev.date !== updated.date || prev.time !== updated.time;
};

export const formatScheduleLabel = (instant: Date, countryCode: string): string => {
  const { date, time } = formatEventLocal(instant, countryCode);
  return `${date} at ${time}`;
};

export async function notifyParticipantsOfScheduleChange(params: {
  eventId: string;
  eventTitle: string;
  participantUserIds: string[];
  previousStartAt: Date;
  newStartAt: Date;
  countryCode: string;
}): Promise<void> {
  const { eventId, eventTitle, participantUserIds, previousStartAt, newStartAt, countryCode } = params;
  if (participantUserIds.length === 0) return;

  const was = formatScheduleLabel(previousStartAt, countryCode);
  const now = formatScheduleLabel(newStartAt, countryCode);
  const title = 'Trip rescheduled';
  const body = `"${eventTitle}" has a new date/time: ${now} (was ${was}).`;

  await Promise.all(
    participantUserIds.map((userId) =>
      dispatchNotification({
        userId,
        title,
        body,
        type: NotificationType.EVENT,
        meta: { eventId, kind: 'schedule_change', previousStartAt: previousStartAt.toISOString(), newStartAt: newStartAt.toISOString() }
      })
    )
  );
}

/** @deprecated Use notifyParticipantsOfScheduleChange */
export const notifyParticipantsOfScheduleChangeDefault = notifyParticipantsOfScheduleChange;
