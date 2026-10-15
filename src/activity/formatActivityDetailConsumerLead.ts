/** Typographic date block for consumer outing detail (no hero image). */
export type ActivityDetailConsumerLeadDate = {
  month: string;
  day: string;
  weekday: string;
  time: string | null;
};

const formatTimeLabel = (time?: string | null): string | null => {
  const raw = time?.trim();
  if (!raw) return null;
  const normalized = raw.length === 5 ? `${raw}:00` : raw;
  const parsed = new Date(`1970-01-01T${normalized}`);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

export const formatActivityDetailConsumerLeadDate = (
  dateStr: string,
  time?: string | null
): ActivityDetailConsumerLeadDate => {
  const date = new Date(dateStr);
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  const timeLabel = formatTimeLabel(time);
  return {
    month: date.toLocaleDateString(undefined, { month: 'short' }),
    day: date.toLocaleDateString(undefined, { day: 'numeric' }),
    weekday,
    time: timeLabel,
  };
};
