import { describe, expect, it } from 'vitest';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { groupListExplorerDateSections, listExplorerIsThisWeekSectionDate } from './listExplorerDateSections';

const card = (id: string, scheduleDate: string | null): DiscoveryCardModel =>
  ({ id, scheduleDate, activity: scheduleDate ? { date: scheduleDate } : undefined }) as DiscoveryCardModel;

describe('groupListExplorerDateSections', () => {
  const now = new Date('2026-10-30T10:00:00+04:00');

  it('groups into Today, This Week, This Month, Next Month, and Beyond next month', () => {
    const sections = groupListExplorerDateSections(
      [
        card('later-year', '2027-01-02'),
        card('nov', '2026-11-06'),
        card('today', '2026-10-30'),
        card('week', '2026-10-31'),
        card('earlier-week', '2026-10-25'),
        card('month', '2026-10-20'),
        card('dec', '2026-12-01'),
        card('sep', '2026-09-12'),
        card('past-year', '2025-05-01'),
        card('open', null),
      ],
      now
    );

    expect(sections.map((section) => section.label)).toEqual([
      'Earlier',
      'Today',
      'This Week',
      'This Month',
      'Next Month',
      'Beyond next month',
      'Anytime',
    ]);
    expect(sections.find((section) => section.label === 'This Week')?.cards.map((item) => item.id)).toEqual([
      'earlier-week',
      'week',
    ]);
    expect(sections.find((section) => section.label === 'This Month')?.cards.map((item) => item.id)).toEqual([
      'month',
    ]);
    expect(sections.find((section) => section.label === 'Next Month')?.cards.map((item) => item.id)).toEqual([
      'nov',
    ]);
    expect(sections.find((section) => section.label === 'Beyond next month')?.cards.map((item) => item.id)).toEqual([
      'dec',
      'later-year',
    ]);
    expect(sections.find((section) => section.label === 'Earlier')?.cards.map((item) => item.id)).toEqual([
      'past-year',
      'sep',
    ]);
    expect(sections.find((section) => section.label === 'Anytime')?.cards.map((item) => item.id)).toEqual(['open']);
  });

  it('keeps This Week ahead of This Month when the week spills into next month', () => {
    const fridayMonthEnd = new Date('2026-10-30T10:00:00+04:00');
    const sections = groupListExplorerDateSections(
      [card('sat', '2026-10-31'), card('nov-sun', '2026-11-01')],
      fridayMonthEnd
    );
    expect(sections.map((section) => ({ key: section.key, ids: section.cards.map((item) => item.id) }))).toEqual([
      { key: 'week', ids: ['sat'] },
      { key: 'next_month', ids: ['nov-sun'] },
    ]);
  });

  it('uses Asia/Dubai calendar day for Today', () => {
    const thursdayEveningDubai = new Date('2026-10-29T19:30:00.000Z');
    const fridayJustStartedDubai = new Date('2026-10-29T20:30:00.000Z');
    expect(groupListExplorerDateSections([card('fri', '2026-10-30')], thursdayEveningDubai)[0]?.key).toBe('week');
    expect(groupListExplorerDateSections([card('fri', '2026-10-30')], fridayJustStartedDubai)[0]?.key).toBe('today');
  });

  it('skips headings when nothing is dated', () => {
    const sections = groupListExplorerDateSections([card('place', null)], now);
    expect(sections).toEqual([{ key: 'all', label: '', cards: [card('place', null)] }]);
  });

  it('flags Sun–Sat week dates excluding today for row “This” prefix', () => {
    expect(listExplorerIsThisWeekSectionDate('2026-10-30', now)).toBe(false);
    expect(listExplorerIsThisWeekSectionDate('2026-10-31', now)).toBe(true);
    expect(listExplorerIsThisWeekSectionDate('2026-10-25', now)).toBe(true);
    expect(listExplorerIsThisWeekSectionDate('2026-11-06', now)).toBe(false);
  });
});
