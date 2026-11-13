import { parseLocalDateTime } from './datetime.js';

type PublishScheduleBody = {
  date?: string;
  time?: string;
  endDate?: string;
  endTime?: string;
};

/** Persist `endAt` for same-day `endTime` and multi-day windows (host When step). */
export const resolvePublishedActivityEndAt = (
  body: PublishScheduleBody,
  countryCode: string
): Date | undefined => {
  if (body.endDate?.trim() && body.endTime?.trim()) {
    return parseLocalDateTime(body.endDate.trim(), body.endTime.trim(), countryCode);
  }
  if (body.endTime?.trim() && body.date?.trim()) {
    return parseLocalDateTime(body.date.trim(), body.endTime.trim(), countryCode);
  }
  return undefined;
};
