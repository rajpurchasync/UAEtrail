import { activityScheduleSpanLabel as sharedActivityScheduleSpanLabel } from '@uaetrail/shared-types';
import type { CreateActivityDraft } from './hostingFlowEngine';
import { todayIso } from './createFlowShared';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const parseIsoNoon = (iso: string): Date => new Date(`${iso.slice(0, 10)}T12:00:00`);

const parseTime = (time: string): { h: number; m: number } | null => {
  const match = /^(\d{2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
};

const formatTime = (h: number, m: number): string =>
  `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

/** Default start time in the when step. */
export const DEFAULT_HOSTING_START_TIME = '06:00';

/** Default same-day end time in the when step. */
export const DEFAULT_HOSTING_END_TIME = '18:00';

/** End date chips in the when step — same day through start + (days − 1). */
export const HOSTING_END_DATE_SCROLL_DAYS = 30;

const toIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const maxSelectableHostingEndDate = (startDate: string): string => {
  if (!ISO_DATE.test(startDate)) return startDate;
  const start = parseIsoNoon(startDate);
  const max = new Date(start);
  max.setDate(start.getDate() + HOSTING_END_DATE_SCROLL_DAYS - 1);
  return toIsoDate(max);
};

export const clampHostingEndDateToWindow = (startDate: string, endDate?: string): string => {
  const normalized = normalizeHostingEndDate(startDate, endDate);
  const maxEnd = maxSelectableHostingEndDate(startDate);
  return normalized > maxEnd ? maxEnd : normalized;
};

export const buildHostingEndDateOptions = (
  startDate: string,
  count = HOSTING_END_DATE_SCROLL_DAYS
): Array<{ iso: string; label: string; day: number }> => {
  if (!ISO_DATE.test(startDate) || count < 1) return [];
  const start = parseIsoNoon(startDate);
  const options: Array<{ iso: string; label: string; day: number }> = [];

  for (let index = 0; index < count; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = toIsoDate(date);
    let label = date.toLocaleDateString('en-US', { weekday: 'short' });
    if (index === 0) label = 'Same';
    options.push({ iso, label, day: date.getDate() });
  }

  return options;
};

/** Default end time — start plus three hours, capped at 23:30 (legacy helper). */
export const defaultEndTimeFromStart = (startTime: string): string => {
  const start = parseTime(startTime) ?? { h: 9, m: 0 };
  let total = start.h * 60 + start.m + 180;
  const cap = 23 * 60 + 30;
  if (total > cap) total = cap;
  return formatTime(Math.floor(total / 60), total % 60);
};

export const normalizeHostingEndDate = (startDate: string, endDate?: string): string => {
  if (!endDate?.trim() || !ISO_DATE.test(endDate)) return startDate;
  return endDate < startDate ? startDate : endDate;
};

/** Earliest selectable outing start day (local calendar). */
export const minHostingScheduleStartDate = (): string => todayIso();

export const clampHostingStartDate = (startDate: string): string => {
  if (!ISO_DATE.test(startDate.trim())) return minHostingScheduleStartDate();
  const min = minHostingScheduleStartDate();
  return startDate < min ? min : startDate;
};

export const isMultiDayHostingSchedule = (draft: Pick<CreateActivityDraft, 'date' | 'endDate'>): boolean =>
  Boolean(draft.endDate?.trim() && draft.endDate > draft.date);

/** Consumer-facing date on the when step — e.g. `Thu, 12 Nov`. */
export const formatHostingScheduleFullDate = (iso: string): string => {
  if (!ISO_DATE.test(iso)) return iso;
  return parseIsoNoon(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

/** Shown beside the end-date control — not inside the date chip. */
export const hostingScheduleSpanLabel = (startDate: string, endDate?: string | null): string =>
  sharedActivityScheduleSpanLabel(startDate, endDate);

const scheduleBoundaryMs = (isoDate: string, time: string): number | null => {
  const parts = parseTime(time);
  if (!parts || !ISO_DATE.test(isoDate)) return null;
  return new Date(`${isoDate}T${formatTime(parts.h, parts.m)}:00`).getTime();
};

/** Elapsed hours between start and end (when end is after start). */
export const hostingScheduleTotalHoursLabel = (
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): string | null => {
  const startMs = scheduleBoundaryMs(startDate, startTime);
  const end = normalizeHostingEndDate(startDate, endDate);
  const endMs = scheduleBoundaryMs(end, endTime);
  if (startMs == null || endMs == null || endMs <= startMs) return null;

  const totalMinutes = Math.round((endMs - startMs) / 60_000);
  const hours = totalMinutes / 60;
  const rounded = Math.round(hours * 10) / 10;
  const value = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return rounded === 1 ? '1 hour total' : `${value} hours total`;
};

export const patchHostingStartDate = (
  draft: Pick<CreateActivityDraft, 'date' | 'endDate'>,
  startDate: string
): Partial<CreateActivityDraft> => {
  const clampedStart = clampHostingStartDate(startDate);
  const prevStart = draft.date;
  const endDate = draft.endDate?.trim() || prevStart;
  const keepEnd = endDate > clampedStart && endDate !== prevStart;
  const resolvedEnd = keepEnd ? endDate : clampedStart;
  return {
    date: clampedStart,
    endDate: clampHostingEndDateToWindow(clampedStart, resolvedEnd),
  };
};

export const patchHostingStartTime = (startTime: string): Partial<CreateActivityDraft> => ({
  time: startTime,
  meetingTime: startTime,
});

export const validateHostingWhenSchedule = (
  draft: CreateActivityDraft,
  options: { rideshare?: boolean } = {}
): string | null => {
  if (!draft.date?.trim()) return 'Choose a start date.';
  if (draft.date < minHostingScheduleStartDate()) return 'Start date cannot be in the past.';
  if (!draft.time?.trim()) return 'Choose a start time.';

  if (options.rideshare) {
    return null;
  }

  const endDate = normalizeHostingEndDate(draft.date, draft.endDate);
  if (!endDate) return 'Choose an end date.';
  if (endDate < draft.date) return 'End date cannot be before the start date.';

  if (!draft.endTime?.trim()) return 'Choose an end time.';

  if (endDate === draft.date) {
    const start = draft.meetingTime?.trim() || draft.time;
    if (draft.endTime <= start) {
      return 'End time should be after the start time.';
    }
  }

  return null;
};

export const formatHostingWhenPreview = (draft: CreateActivityDraft): string => {
  const startTime = draft.time?.trim() || draft.meetingTime?.trim() || '';
  const endDate = normalizeHostingEndDate(draft.date, draft.endDate);
  const datePart =
    endDate > draft.date ? `${draft.date} → ${endDate}` : draft.date;
  if (!startTime) return datePart;
  const endTime = draft.endTime?.trim();
  if (endTime) return `${datePart} · ${startTime}–${endTime}`;
  return `${datePart} · ${startTime}`;
};
