import { gccTodayIsoDate } from './weatherDisplayUtils';

/** Calendar math on `YYYY-MM-DD` (UTC noon avoids DST edge cases). */
export const addIsoCalendarDays = (iso: string, deltaDays: number): string => {
  const base = new Date(`${iso}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + deltaDays);
  return base.toISOString().slice(0, 10);
};

export const inclusiveIsoDateRange = (start: string, end: string, maxDays = 31): string[] => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return [];
  const last = end >= start && /^\d{4}-\d{2}-\d{2}$/.test(end) ? end : start;
  const out: string[] = [];
  let cur = start;
  while (cur <= last && out.length < maxDays) {
    out.push(cur);
    if (cur === last) break;
    cur = addIsoCalendarDays(cur, 1);
  }
  return out;
};

/** Next N calendar days from today (Asia/Dubai), including today. */
export const nextIsoDaysFromToday = (count: number): string[] => {
  const today = gccTodayIsoDate();
  return Array.from({ length: Math.max(0, count) }, (_, i) => addIsoCalendarDays(today, i));
};

export const PLACE_DETAIL_FORECAST_DAYS = 7;
