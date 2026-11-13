import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { listExplorerCardDateIso } from './listExplorerCardMeta';

export type ListExplorerDateSection = {
  key: string;
  label: string;
  cards: DiscoveryCardModel[];
};

const DUBAI_TZ = 'Asia/Dubai';

/** Calendar `YYYY-MM-DD` in Asia/Dubai. */
export const listExplorerDubaiYmd = (now: Date = new Date()): string =>
  now.toLocaleDateString('en-CA', { timeZone: DUBAI_TZ });

const monthKey = (iso: string): string => iso.slice(0, 7);

const nextMonthKey = (iso: string): string => {
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
};

/** Sunday = 0 in Asia/Dubai for the given calendar day. */
const dubaiWeekdaySun0 = (iso: string): number => new Date(`${iso}T12:00:00+04:00`).getUTCDay();

const addDaysYmd = (iso: string, days: number): string => {
  const stamp = new Date(`${iso}T12:00:00+04:00`);
  stamp.setUTCDate(stamp.getUTCDate() + days);
  return stamp.toLocaleDateString('en-CA', { timeZone: DUBAI_TZ });
};

type SectionSlot = { key: string; label: string; sort: number };

/** Today → this Sun–Sat week → rest of this month → next month → after that. */
const sectionSlot = (iso: string, now: Date): SectionSlot | null => {
  const target = iso.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(target)) return null;

  const today = listExplorerDubaiYmd(now);
  if (target === today) {
    return { key: 'today', label: 'Today', sort: 1 };
  }

  const weekStart = addDaysYmd(today, -dubaiWeekdaySun0(today));
  const weekEnd = addDaysYmd(weekStart, 6);
  if (target >= weekStart && target <= weekEnd) {
    return { key: 'week', label: 'This Week', sort: 2 };
  }

  const thisMonth = monthKey(today);
  const targetMonth = monthKey(target);
  if (targetMonth === thisMonth) {
    return { key: 'month', label: 'This Month', sort: 3 };
  }

  const upcomingMonth = nextMonthKey(today);
  if (targetMonth === upcomingMonth) {
    return { key: 'next_month', label: 'Next Month', sort: 4 };
  }
  if (targetMonth > upcomingMonth) {
    return { key: 'beyond', label: 'Beyond next month', sort: 5 };
  }
  return { key: 'earlier', label: 'Earlier', sort: 0 };
};

/** Matches the “This Week” list section — not Today or later buckets. */
export const listExplorerIsThisWeekSectionDate = (iso: string, now: Date = new Date()): boolean =>
  sectionSlot(iso, now)?.key === 'week';

export const groupListExplorerDateSections = (
  cards: DiscoveryCardModel[],
  now: Date = new Date()
): ListExplorerDateSection[] =>
  groupListExplorerByIso(cards, listExplorerCardDateIso, now);

export const groupListExplorerByIso = (
  cards: DiscoveryCardModel[],
  isoForCard: (card: DiscoveryCardModel) => string | null,
  now: Date = new Date()
): ListExplorerDateSection[] => {
  const dated = cards.some((card) => isoForCard(card));
  if (!dated) {
    return [{ key: 'all', label: '', cards }];
  }

  const buckets = new Map<string, ListExplorerDateSection & { sort: number }>();
  const undated: DiscoveryCardModel[] = [];

  for (const card of cards) {
    const iso = isoForCard(card);
    const slot = iso ? sectionSlot(iso, now) : null;
    if (!slot) {
      undated.push(card);
      continue;
    }
    const existing = buckets.get(slot.key);
    if (existing) existing.cards.push(card);
    else buckets.set(slot.key, { ...slot, cards: [card] });
  }

  if (undated.length > 0) {
    buckets.set('anytime', { key: 'anytime', label: 'Anytime', sort: 6, cards: undated });
  }

  const sections = [...buckets.values()].sort((a, b) => a.sort - b.sort);
  for (const section of sections) {
    section.cards.sort((a, b) => {
      const isoA = isoForCard(a);
      const isoB = isoForCard(b);
      if (!isoA && !isoB) return 0;
      if (!isoA) return 1;
      if (!isoB) return -1;
      return isoA.localeCompare(isoB);
    });
  }
  return sections;
};
