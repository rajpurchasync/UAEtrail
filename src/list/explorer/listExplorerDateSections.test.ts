import { describe, expect, it } from 'vitest';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { groupListExplorerDateSections, listExplorerIsThisWeekSectionDate } from './listExplorerDateSections';

const card = (id: string, scheduleDate: string | null): DiscoveryCardModel =>
  ({ id, scheduleDate, activity: scheduleDate ? { date: scheduleDate } : undefined }) as DiscoveryCardModel;

describe('groupListExplorerDateSections', () => {
  const now = new Date('2026-10-30T10:00:00');

  it('groups today, this week, this month, later months, later years, then earlier', () => {
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
      'Today',
      'This week',
      'This month',
      'November',
      'December',
      'September',
      '2027',
      '2025',
      'Anytime',
    ]);
    expect(sections.find((section) => section.label === 'This week')?.cards.map((item) => item.id)).toEqual([
      'earlier-week',
      'week',
    ]);
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
