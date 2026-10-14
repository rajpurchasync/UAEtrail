const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const formatTime = (d: Date): string =>
  d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

/**
 * Homepage + marketing activity time — docs/content.md
 * e.g. Fri, 6:00 AM · Tomorrow, 5:00 PM · Today, 8:00 AM
 */
export function formatActivityTime(startsAt: Date | string, now: Date = new Date()): string {
  const date = typeof startsAt === 'string' ? new Date(startsAt) : startsAt;
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const time = formatTime(date);
  const today = startOfDay(now);
  const target = startOfDay(date);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) {
    return `Today, ${time}`;
  }
  if (diffDays === 1) {
    return `Tomorrow, ${time}`;
  }

  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  return `${weekday}, ${time}`;
}
