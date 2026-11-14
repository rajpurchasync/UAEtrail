const startOfDay = (value: Date): Date => {
  const copy = new Date(value);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const parseIso = (iso: string): Date | null => {
  const target = new Date(`${iso}T12:00:00`);
  return Number.isNaN(target.getTime()) ? null : startOfDay(target);
};

type SectionSlot = { key: string; label: string; sort: number };

/** Today → this Sun–Sat week → rest of calendar month → everything else. */
export const browseListSectionSlot = (iso: string, now: Date): SectionSlot | null => {
  const target = parseIso(iso);
  if (!target) return null;
  const today = startOfDay(now);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  if (target.getTime() === today.getTime()) {
    return { key: 'today', label: 'Today', sort: 0 };
  }
  if (target >= weekStart && target <= weekEnd) {
    return { key: 'week', label: 'This week', sort: 1 };
  }
  if (target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth()) {
    return { key: 'month', label: 'This month', sort: 2 };
  }
  return { key: 'other', label: 'Other', sort: 3 };
};

/** Matches the “This week” list section — not Today or later buckets. */
export const browseListIsThisWeekSectionDate = (iso: string, now: Date = new Date()): boolean =>
  browseListSectionSlot(iso, now)?.key === 'week';