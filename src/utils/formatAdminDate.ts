import {
  formatExploreClockFromDate,
  getExploreClockStyle,
  type ExploreClockStyle,
} from '@uaetrail/shared-types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

const parseAdminDate = (value: string | Date | number | null | undefined): Date | null => {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const ymd = DATE_ONLY.exec(value.trim());
  if (ymd) {
    const parsed = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Admin console date: `Wed, 31/01/26` */
export const formatAdminDate = (value: string | Date | number | null | undefined): string => {
  const date = parseAdminDate(value);
  if (!date) return '—';
  return `${WEEKDAYS[date.getDay()]}, ${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${String(date.getFullYear()).slice(-2)}`;
};

/** Date plus clock time from the member display preference (`AM/PM` or 24-hour). */
export const formatAdminDateTime = (
  value: string | Date | number | null | undefined,
  clock: ExploreClockStyle = getExploreClockStyle()
): string => {
  if (typeof value === 'string' && DATE_ONLY.test(value.trim())) return formatAdminDate(value);
  const date = parseAdminDate(value);
  if (!date) return '—';
  return `${formatAdminDate(date)} ${formatExploreClockFromDate(date, clock)}`;
};
