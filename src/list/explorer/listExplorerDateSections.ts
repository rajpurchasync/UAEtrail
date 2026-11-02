import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { listExplorerCardDateIso } from './listExplorerCardMeta';

export type ListExplorerDateSection = {
  key: string;
  label: string;
  cards: DiscoveryCardModel[];
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

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

/** Today, rest of this Sun–Sat week, rest of this month, later months, later years, then earlier. */
const sectionSlot = (iso: string, now: Date): SectionSlot | null => {
  const target = parseIso(iso);
  if (!target) return null;
  const today = startOfDay(now);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  if (target.getTime() === today.getTime()) {
    return { key: 'today', label: 'Today', sort: 0 };
  }
  if (target >= weekStart && target <= weekEnd) {
    return { key: 'week', label: 'This week', sort: 1 };
  }
  if (
    target.getFullYear() === today.getFullYear() &&
    target.getMonth() === today.getMonth()
  ) {
    return { key: 'month', label: 'This month', sort: 2 };
  }
  if (target.getFullYear() === today.getFullYear() && target > monthEnd) {
    return {
      key: `month-${target.getMonth()}`,
      label: MONTHS[target.getMonth()] ?? '',
      sort: 100 + target.getMonth(),
    };
  }
  if (target.getFullYear() === today.getFullYear()) {
    return {
      key: `month-${target.getMonth()}`,
      label: MONTHS[target.getMonth()] ?? '',
      sort: 200 + target.getMonth(),
    };
  }
  if (target.getFullYear() > today.getFullYear()) {
    return {
      key: `year-${target.getFullYear()}`,
      label: String(target.getFullYear()),
      sort: 1000 + (target.getFullYear() - 2000),
    };
  }
  return {
    key: `year-${target.getFullYear()}`,
    label: String(target.getFullYear()),
    sort: 2000 + (target.getFullYear() - 2000),
  };
};

export const groupListExplorerDateSections = (
  cards: DiscoveryCardModel[],
  now: Date = new Date()
): ListExplorerDateSection[] => {
  const dated = cards.some((card) => listExplorerCardDateIso(card));
  if (!dated) {
    return [{ key: 'all', label: '', cards }];
  }

  const buckets = new Map<string, ListExplorerDateSection & { sort: number }>();
  const undated: DiscoveryCardModel[] = [];

  for (const card of cards) {
    const iso = listExplorerCardDateIso(card);
    const slot = iso ? sectionSlot(iso, now) : null;
    if (!slot) {
      undated.push(card);
      continue;
    }
    const existing = buckets.get(slot.key);
    if (existing) existing.cards.push(card);
    else buckets.set(slot.key, { ...slot, cards: [card] });
  }

  const sections = [...buckets.values()].sort((a, b) => a.sort - b.sort);
  for (const section of sections) {
    section.cards.sort((a, b) =>
      (listExplorerCardDateIso(a) ?? '').localeCompare(listExplorerCardDateIso(b) ?? '')
    );
  }
  if (undated.length > 0) {
    sections.push({ key: 'anytime', label: 'Anytime', sort: 9000, cards: undated });
  }
  return sections;
};
