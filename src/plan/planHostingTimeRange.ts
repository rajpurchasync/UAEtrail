/** Hosted outings outside the current calendar month (paginated “Later” lens). */
export type PlanHostingTimeRange = 'other';

/** Summary chips — today / week / month counts only. */
export type PlanHostingCountRange = 'today' | 'week' | 'month';

/** Desktop hosting hub schedule filter (chips + paginated later). */
export type PlanHostingScheduleLens = PlanHostingCountRange | PlanHostingTimeRange;

const startOfDay = (d: Date): Date => new Date(d.toDateString());

const addDays = (d: Date, days: number): Date => {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfWeek = (d: Date): Date => {
  const day = startOfDay(d);
  const weekday = day.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  return addDays(day, mondayOffset);
};

const endOfWeekExclusive = (weekStart: Date): Date => addDays(weekStart, 7);

const startOfMonth = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), 1);

const endOfMonthExclusive = (monthStart: Date): Date =>
  new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

export const toPlanHostingIsoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export type PlanHostingListWindowQuery = {
  startAtGte: string;
  startAtLt: string;
  windowOutside?: boolean;
  upcomingFromToday?: boolean;
};

/** Server list filters for `GET /publishing/activities` — member tenant only, not explore map. */
export const planHostingListWindowQuery = (
  range: PlanHostingTimeRange | PlanHostingCountRange,
  now: Date = new Date()
): PlanHostingListWindowQuery => {
  const today = startOfDay(now);

  if (range === 'today') {
    const tomorrow = addDays(today, 1);
    return {
      startAtGte: toPlanHostingIsoDate(today),
      startAtLt: toPlanHostingIsoDate(tomorrow),
      upcomingFromToday: true,
    };
  }

  if (range === 'week') {
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeekExclusive(weekStart);
    return {
      startAtGte: toPlanHostingIsoDate(weekStart),
      startAtLt: toPlanHostingIsoDate(weekEnd),
      upcomingFromToday: true,
    };
  }

  if (range === 'month') {
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonthExclusive(monthStart);
    return {
      startAtGte: toPlanHostingIsoDate(monthStart),
      startAtLt: toPlanHostingIsoDate(monthEnd),
      upcomingFromToday: true,
    };
  }

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonthExclusive(monthStart);
  return {
    startAtGte: toPlanHostingIsoDate(monthStart),
    startAtLt: toPlanHostingIsoDate(monthEnd),
    windowOutside: true,
    upcomingFromToday: true,
  };
};

/** Inclusive start, exclusive end — matches calendar day on activity `date` (YYYY-MM-DD). */
export const activityDateInHostingRange = (
  activityDate: string,
  range: PlanHostingTimeRange | PlanHostingCountRange,
  now: Date = new Date()
): boolean => {
  const eventDay = startOfDay(new Date(activityDate));
  const { startAtGte, startAtLt, windowOutside } = planHostingListWindowQuery(range, now);
  const rangeStart = startOfDay(new Date(startAtGte));
  const rangeEnd = startOfDay(new Date(startAtLt));

  if (windowOutside) {
    return eventDay < rangeStart || eventDay >= rangeEnd;
  }

  return eventDay >= rangeStart && eventDay < rangeEnd;
};

export const countHostedActivitiesInRange = (
  activityDates: string[],
  range: PlanHostingCountRange,
  now: Date = new Date()
): number =>
  activityDates.filter((date) => activityDateInHostingRange(date, range, now)).length;
