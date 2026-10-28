/** GCC IANA zones for activity schedule fields (matches API `datetime.ts`). */
const COUNTRY_TIMEZONE: Record<string, { tz: string; offset: string }> = {
  AE: { tz: 'Asia/Dubai', offset: '+04:00' },
  SA: { tz: 'Asia/Riyadh', offset: '+03:00' },
  OM: { tz: 'Asia/Muscat', offset: '+04:00' },
  QA: { tz: 'Asia/Qatar', offset: '+03:00' },
  BH: { tz: 'Asia/Bahrain', offset: '+03:00' },
  KW: { tz: 'Asia/Kuwait', offset: '+03:00' },
};

const resolveCountry = (countryCode?: string | null) =>
  COUNTRY_TIMEZONE[countryCode?.toUpperCase() ?? 'AE'] ?? COUNTRY_TIMEZONE.AE;

const resolveOffset = (countryCode?: string | null): string => resolveCountry(countryCode).offset;

const formatInstantLocalDate = (instant: Date, countryCode?: string | null): string => {
  const { tz } = resolveCountry(countryCode);
  return instant.toLocaleDateString('en-CA', { timeZone: tz });
};

export const parseActivityLocalDateTime = (
  date: string,
  time: string,
  countryCode?: string | null
): Date => new Date(`${date}T${time}:00${resolveOffset(countryCode)}`);

/** Scheduled end instant for wire/API fields (end of outing day when no explicit end). */
export const resolveActivityScheduleEndInstant = (
  startAt: Date,
  endAt: Date | null,
  countryCode?: string | null
): Date => {
  if (endAt) return endAt;
  const localDate = formatInstantLocalDate(startAt, countryCode);
  return parseActivityLocalDateTime(localDate, '23:59', countryCode);
};

/** Whether a stored outing instant is in the past. */
export const activityInstantHasEnded = (
  startAt: Date,
  endAt: Date | null,
  countryCode?: string | null
): boolean => {
  const end = resolveActivityScheduleEndInstant(startAt, endAt, countryCode);
  return end.getTime() <= Date.now();
};

export type ActivityScheduleFields = {
  date: string;
  time: string;
  endDate?: string | null;
  endTime?: string | null;
  countryCode?: string | null;
};

/** Client DTO — explicit end date/time, same-day `endTime`, or end of outing day. */
export const resolveActivityScheduleEndFromFields = (
  activity: ActivityScheduleFields
): Date => {
  if (activity.endDate) {
    return parseActivityLocalDateTime(
      activity.endDate,
      activity.endTime ?? activity.time ?? '23:59',
      activity.countryCode
    );
  }
  if (activity.endTime?.trim()) {
    return parseActivityLocalDateTime(activity.date, activity.endTime.trim(), activity.countryCode);
  }
  return parseActivityLocalDateTime(activity.date, '23:59', activity.countryCode);
};

export const activityScheduleHasEnded = (activity: ActivityScheduleFields): boolean => {
  const end = resolveActivityScheduleEndFromFields(activity);
  return end.getTime() <= Date.now();
};
