import { describe, expect, it } from 'vitest';
import {
  activityDateInHostingRange,
  countHostedActivitiesInRange,
  planHostingListWindowQuery,
} from './planHostingTimeRange';

describe('planHostingTimeRange', () => {
  const now = new Date('2026-03-10T15:00:00'); // Tuesday

  it('matches today only', () => {
    expect(activityDateInHostingRange('2026-03-10', 'today', now)).toBe(true);
    expect(activityDateInHostingRange('2026-03-11', 'today', now)).toBe(false);
  });

  it('matches current calendar week (Mon–Sun)', () => {
    expect(activityDateInHostingRange('2026-03-09', 'week', now)).toBe(true);
    expect(activityDateInHostingRange('2026-03-15', 'week', now)).toBe(true);
    expect(activityDateInHostingRange('2026-03-16', 'week', now)).toBe(false);
  });

  it('matches current month', () => {
    expect(activityDateInHostingRange('2026-03-01', 'month', now)).toBe(true);
    expect(activityDateInHostingRange('2026-03-31', 'month', now)).toBe(true);
    expect(activityDateInHostingRange('2026-04-01', 'month', now)).toBe(false);
  });

  it('other is outside current month', () => {
    expect(activityDateInHostingRange('2026-04-02', 'other', now)).toBe(true);
    expect(activityDateInHostingRange('2026-03-12', 'other', now)).toBe(false);
  });

  it('builds list query for other with outside window', () => {
    const query = planHostingListWindowQuery('other', now);
    expect(query.windowOutside).toBe(true);
    expect(query.upcomingFromToday).toBe(true);
    expect(query.startAtGte).toBe('2026-03-01');
    expect(query.startAtLt).toBe('2026-04-01');
  });

  it('counts activities in range', () => {
    expect(
      countHostedActivitiesInRange(['2026-03-10', '2026-03-11', '2026-04-02'], 'week', now)
    ).toBe(2);
  });
});
