import {
  formatActivityScheduleDateRangeLabel,
  formatActivityScheduleTimeRangeLabel,
  formatExploreEventDateLabel,
} from '@uaetrail/shared-types';

/** Typographic date block for consumer outing detail (no hero image). */
export type ActivityDetailConsumerLeadDate = {
  /** Progressive stamp: week → weekday; month → `Sat 12`; year → `Sat 12 Sep`; else full. */
  label: string;
  month: string;
  day: string;
  weekday: string;
  time: string | null;
};

export const formatActivityDetailConsumerLeadDate = (
  dateStr?: string | null,
  time?: string | null,
  endDate?: string | null,
  endTime?: string | null
): ActivityDetailConsumerLeadDate => {
  const timeLabel = formatActivityScheduleTimeRangeLabel(time, endTime);
  if (!dateStr) {
    return { label: '', month: '', day: '', weekday: '', time: timeLabel };
  }
  const date = new Date(`${dateStr.slice(0, 10)}T12:00:00`);
  const label =
    formatActivityScheduleDateRangeLabel(dateStr, endDate) ??
    formatExploreEventDateLabel(dateStr) ??
    dateStr;
  return {
    label,
    month: date.toLocaleDateString('en-GB', { month: 'short' }),
    day: String(date.getDate()).padStart(2, '0'),
    weekday: date.toLocaleDateString('en-GB', { weekday: 'long' }),
    time: timeLabel,
  };
};
