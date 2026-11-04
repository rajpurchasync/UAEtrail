import { describe, expect, it } from 'vitest';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import {
  DEFAULT_LIST_EXPLORER_SORT,
  groupListExplorerSections,
  listExplorerCardPostDateIso,
  listExplorerSortButtonLabel,
  parseListExplorerSort,
  serializeListExplorerSort,
  sortListExplorerCards,
} from './listExplorerSort';

const card = (id: string, title: string, dateIso?: string): DiscoveryCardModel =>
  ({
    id,
    path: `/activity/${id}`,
    source: 'activity',
    kind: 'hiking',
    tone: 'hiking',
    emoji: '🥾',
    headline: title,
    listTitle: title,
    listHost: null,
    subtitle: null,
    price: null,
    spotsLabel: null,
    venueHint: null,
    showJoinHint: false,
    primaryCta: 'View',
    secondaryCta: null,
    showJoinActions: false,
    shareTitle: title,
    sharePath: '/explore',
    sections: {},
    scheduleDate: dateIso ?? null,
    mapLatitude: 25.0,
    mapLongitude: 55.1,
  }) as DiscoveryCardModel;

const cardWithPostDate = (
  id: string,
  title: string,
  postIso: string,
  eventIso?: string
): DiscoveryCardModel =>
  ({
    ...card(id, title, eventIso),
    activity: { createdAt: `${postIso}T08:00:00.000Z` },
  }) as DiscoveryCardModel;

describe('listExplorerSort', () => {
  it('defaults event date ascending in URL', () => {
    expect(parseListExplorerSort(null)).toBe(DEFAULT_LIST_EXPLORER_SORT);
    expect(serializeListExplorerSort('event_asc')).toBeNull();
  });

  it('orders events by schedule date ascending', () => {
    const items = [
      card('b', 'Later', '2026-12-01'),
      card('a', 'Soon', '2026-11-01'),
    ];
    const sorted = sortListExplorerCards(items, 'event_asc', null);
    expect(sorted.map((entry) => entry.id)).toEqual(['a', 'b']);
  });

  it('groups names by distributed first letters', () => {
    const sections = groupListExplorerSections(
      [card('1', 'Alpha'), card('2', 'Echo'), card('3', 'November')],
      'name_asc',
      null
    );
    expect(sections.map((section) => section.label)).toEqual(['A', 'E', 'N']);
    expect(sections.flatMap((section) => section.cards.map((entry) => entry.id))).toEqual([
      '1',
      '2',
      '3',
    ]);
  });

  it('groups post date sorts with posted section headings', () => {
    const now = new Date('2026-10-30T10:00:00');
    const sections = groupListExplorerSections(
      [
        cardWithPostDate('today', 'Today post', '2026-10-30'),
        cardWithPostDate('week', 'Week post', '2026-10-31'),
        cardWithPostDate('nov', 'Older post', '2026-11-06'),
        card('undated', 'No stamp'),
      ],
      'post_asc',
      null,
      now
    );
    expect(sections.map((section) => section.label)).toEqual([
      'Posted today',
      'Posted this week',
      'Posted in November',
      'No post date',
    ]);
    expect(listExplorerCardPostDateIso(card('undated', 'No stamp'))).toBeNull();
  });

  it('labels the sort trigger from the active mode', () => {
    expect(listExplorerSortButtonLabel('event_asc')).toBe('Event · Oldest first');
    expect(listExplorerSortButtonLabel('post_desc')).toBe('Post · Newest first');
    expect(listExplorerSortButtonLabel('near_me')).toBe('Near me · By distance');
  });
});
