export type TimePeriod = 'AM' | 'PM';

export interface Time12Parts {
  hour: number;
  minute: number;
  period: TimePeriod;
}

/** Parse `HH:mm` (24h) into 12-hour parts. */
export const parseTime24 = (value: string): Time12Parts => {
  const [hourRaw, minuteRaw] = value.split(':');
  const hour24 = Number(hourRaw);
  const minute = Number.isFinite(Number(minuteRaw)) ? Number(minuteRaw) : 0;
  if (!Number.isFinite(hour24)) {
    return { hour: 9, minute: 0, period: 'AM' };
  }
  const period: TimePeriod = hour24 >= 12 ? 'PM' : 'AM';
  const hour = hour24 % 12 || 12;
  return { hour, minute, period };
};

/** Format 12-hour parts to `HH:mm` (24h). */
export const formatTime24 = ({ hour, minute, period }: Time12Parts): string => {
  let hour24 = hour % 12;
  if (period === 'PM') hour24 += 12;
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

export const HOUR_OPTIONS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
export const MINUTE_OPTIONS = [0, 15, 30, 45] as const;

export const snapMinuteToQuarter = (minute: number): (typeof MINUTE_OPTIONS)[number] => {
  const snapped = Math.round(minute / 15) * 15;
  if (snapped >= 60) return 0;
  return snapped as (typeof MINUTE_OPTIONS)[number];
};

export const PERIOD_OPTIONS: TimePeriod[] = ['AM', 'PM'];
