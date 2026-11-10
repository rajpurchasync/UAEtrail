import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { inclusiveIsoDateRange } from './weatherDateRange';

export const readActivityForecastIsoDate = (activity: ActivityDetailDTO): string | null => {
  const raw = activity.date?.trim() ?? '';
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const slice = raw.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(slice) ? slice : null;
};

/** Inclusive outing dates for weather (start through end). */
export const activityForecastIsoDates = (activity: ActivityDetailDTO): string[] => {
  const start = readActivityForecastIsoDate(activity);
  if (!start) return [];
  const endRaw = activity.endDate?.trim().slice(0, 10) ?? '';
  const end = /^\d{4}-\d{2}-\d{2}$/.test(endRaw) && endRaw >= start ? endRaw : start;
  return inclusiveIsoDateRange(start, end);
};
