import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { browseCardDateIso } from './browseCardMeta';
import { browseListSectionSlot, browseListIsThisWeekSectionDate } from './browseListSectionDates';

export type ListExplorerDateSection = {
  key: string;
  label: string;
  cards: DiscoveryCardModel[];
};

/** Matches the “This week” list section — not Today or later buckets. */
export const listExplorerIsThisWeekSectionDate = browseListIsThisWeekSectionDate;

export const groupListExplorerDateSections = (
  cards: DiscoveryCardModel[],
  now: Date = new Date()
): ListExplorerDateSection[] => groupListExplorerByIso(cards, browseCardDateIso, now);

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
    const slot = iso ? browseListSectionSlot(iso, now) : null;
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