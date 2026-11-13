import { formatExploreEventDateLabel, formatExploreTime } from './explore-presentation.js';

const ymd = (value?: string | null): string => value?.trim().slice(0, 10) ?? '';

/** Inclusive date range for activity detail, cards, and hero. */
export const formatActivityScheduleDateRangeLabel = (
  startDate?: string | null,
  endDate?: string | null
): string | null => {
  const start = ymd(startDate);
  if (!start) return null;
  const startLabel = formatExploreEventDateLabel(start);
  if (!startLabel) return null;
  const end = ymd(endDate);
  if (!end || end === start) return startLabel;
  const endLabel = formatExploreEventDateLabel(end);
  if (!endLabel) return startLabel;
  return `${startLabel} – ${endLabel}`;
};

/** Start–end clock range when both are set. */
export const formatActivityScheduleTimeRangeLabel = (
  startTime?: string | null,
  endTime?: string | null
): string | null => {
  const start = formatExploreTime(startTime?.trim().slice(0, 5));
  if (!start) return null;
  const end = formatExploreTime(endTime?.trim().slice(0, 5));
  if (!end || end === start) return start;
  return `${start} – ${end}`;
};

export const activityScheduleIsMultiDay = (
  startDate?: string | null,
  endDate?: string | null
): boolean => {
  const start = ymd(startDate);
  const end = ymd(endDate);
  return Boolean(start && end && end > start);
};
