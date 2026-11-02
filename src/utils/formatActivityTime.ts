import { formatExploreClockFromDate, formatExploreEventDateLabel } from '@uaetrail/shared-types';

const localIsoDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

/** Homepage outing time — coming weekday, otherwise `09 Nov 26`, then the clock time. */
export function formatActivityTime(startsAt: Date | string, now: Date = new Date()): string {
  const date = typeof startsAt === 'string' ? new Date(startsAt) : startsAt;
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const time = formatExploreClockFromDate(date);
  const label = formatExploreEventDateLabel(localIsoDate(date), now);
  return label ? `${label}, ${time}` : time;
}
