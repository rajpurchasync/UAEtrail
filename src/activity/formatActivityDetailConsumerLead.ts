import { formatExploreEventDateLabel, formatExploreTime } from '@uaetrail/shared-types';

/** Typographic date block for consumer outing detail (no hero image). */
export type ActivityDetailConsumerLeadDate = {
  /** Weekday within 6 days, otherwise `09 Nov 26`. */
  label: string;
  month: string;
  day: string;
  weekday: string;
  time: string | null;
};

const formatTimeLabel = (time?: string | null): string | null => formatExploreTime(time?.trim().slice(0, 5));

export const formatActivityDetailConsumerLeadDate = (
  dateStr?: string | null,
  time?: string | null
): ActivityDetailConsumerLeadDate => {
  const timeLabel = formatTimeLabel(time);
  if (!dateStr) {
    return { label: '', month: '', day: '', weekday: '', time: timeLabel };
  }
  const date = new Date(`${dateStr.slice(0, 10)}T12:00:00`);
  const label = formatExploreEventDateLabel(dateStr) ?? dateStr;
  return {
    label,
    month: date.toLocaleDateString('en-GB', { month: 'short' }),
    day: String(date.getDate()).padStart(2, '0'),
    weekday: date.toLocaleDateString('en-GB', { weekday: 'long' }),
    time: timeLabel,
  };
};
