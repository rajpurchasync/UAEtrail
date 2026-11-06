import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { listExplorerCardDateIso } from './listExplorerCardMeta';

export type ListExplorerDateSection = {
  key: string;
  label: string;
  cards: DiscoveryCardModel[];
};

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
const sectionSlot = (iso: string, now: Date): SectionSlot | null => {
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
    const other = buckets.get('other');
    if (other) other.cards.push(...undated);
    else buckets.set('other', { key: 'other', label: 'Other', sort: 3, cards: undated });
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
