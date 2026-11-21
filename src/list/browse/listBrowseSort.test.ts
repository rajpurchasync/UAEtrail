import { describe, expect, it } from 'vitest';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import {
  DEFAULT_BROWSE_LIST_SORT,
  groupBrowseListSections,
  browseListCardPostDateIso,
  browseListSortAriaLabel,
  browseListSortButtonLabel,
  parseBrowseListSort,
  serializeBrowseListSort,
  sortBrowseListCards,
} from './listBrowseSort';

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

describe('browseListSort', () => {
  it('defaults event date ascending in URL', () => {
    expect(parseBrowseListSort(null)).toBe(DEFAULT_BROWSE_LIST_SORT);
    expect(serializeBrowseListSort('event_asc')).toBeNull();
  });

  it('orders events by schedule date ascending', () => {
    const items = [
      card('b', 'Later', '2026-12-01'),
      card('a', 'Soon', '2026-11-01'),
    ];
    const sorted = sortBrowseListCards(items, 'event_asc', null);
    expect(sorted.map((entry) => entry.id)).toEqual(['a', 'b']);
  });

  it('groups names by distributed first letters', () => {
    const sections = groupBrowseListSections(
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
    const sections = groupBrowseListSections(
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
      'Other',
    ]);
    expect(browseListCardPostDateIso(card('undated', 'No stamp'))).toBeNull();
  });

  it('merges many first letters into at most five balanced sections', () => {
    const cards = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter, index) =>
      card(String(index), `${letter} outing`)
    );
    const sections = groupBrowseListSections(cards, 'name_asc', null);
    expect(sections.length).toBeLessThanOrEqual(5);
    expect(sections.flatMap((section) => section.cards).length).toBe(26);
    const sizes = sections.map((section) => section.cards.length);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(6);
  });

  it('labels the sort trigger from the active mode', () => {
    expect(browseListSortButtonLabel('event_asc')).toBe('Date');
    expect(browseListSortButtonLabel('post_desc')).toBe('Posting Date');
    expect(browseListSortButtonLabel('name_asc')).toBe('Name');
    expect(browseListSortButtonLabel('name_desc')).toBe('Name');
    expect(browseListSortButtonLabel('near_me')).toBe('Near Me');
    expect(browseListSortAriaLabel('name_asc')).toBe('Sort by Name, ascending');
    expect(browseListSortAriaLabel('name_desc')).toBe('Sort by Name, descending');
  });
});