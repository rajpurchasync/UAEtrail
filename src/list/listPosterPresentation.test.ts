import { describe, expect, it } from 'vitest';
import { buildExploreCardModel } from '../explore/exploreCardModel';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  formatListFeedPosterTitleLines,
  resolveBrowsePosterScheduleGrid,
} from './listPosterPresentation';
import { listCategoryResultsLabel } from './listCategoryCopy';
import { resolveListFeedFooterModel } from './listFeedFooterActions';

describe('list poster presentation', () => {
  it('formats poster title as two words per line, four words max', () => {
    expect(formatListFeedPosterTitleLines('Fossil Rock Overnight Camp')).toEqual({
      line1: 'Fossil Rock',
      line2: 'Overnight Camp',
    });
    expect(formatListFeedPosterTitleLines('Sunrise Hike')).toEqual({
      line1: 'Sunrise Hike',
      line2: null,
    });
  });

  it('uses calendar date, clock time, and short price', () => {
    const card = buildExploreCardModel({
      id: 'activity:a1',
      kind: 'hiking',
      source: 'activity',
      title: 'Camp',
      latitude: 25,
      longitude: 56,
      path: '/activity/a1',
      date: '2026-10-12',
      time: '16:00',
      activity: {
        id: 'a1',
        tenantId: 't1',
        tenantSlug: 'host',
        locationId: 'l1',
        locationName: 'Place',
        activityType: 'hiking',
        title: 'Camp',
        description: '',
        date: '2026-10-12',
        time: '16:00',
        price: 200,
        slotsTotal: 12,
        slotsAvailable: 5,
        status: 'published',
      },
      presentation: {
        kind: 'hiking',
        source: 'activity',
        emoji: '🥾',
        headline: 'Camp',
        listTitle: 'Camp',
        listHost: 'Host',
        subtitle: 'Place',
        whenLabel: 'Tomorrow at 4 PM',
        listWhen: 'Tmr · 4 PM',
        primaryCta: 'Join',
        secondaryCta: 'Details',
        spotsLabel: '5 spots',
        sections: { details: [], listWhen: 'Tmr · 4 PM' },
      },
    } as unknown as ExploreMapItemDTO);

    const cardWithPrice = {
      ...card,
      price: { kind: 'paid' as const, badge: 'Paid Event · AED 200' },
      spotsLabel: '12 spots',
    };

    const grid = resolveBrowsePosterScheduleGrid(cardWithPrice);
    expect(grid.dateLabel).toMatch(/Oct 12/);
    expect(grid.timeLabel).toBe('Starts 4 PM');
    expect(grid.priceLabel).toBe('AED 200');
    expect(grid.spotsLabel).toBe('12 spots');
  });
});

describe('listCategoryResultsLabel', () => {
  it('uses activity count copy for trips', () => {
    expect(listCategoryResultsLabel(7, 'trips')).toBe('Found 7 plans and trips');
    expect(listCategoryResultsLabel(1, 'trips')).toBe('Found 1 plan and trip');
  });
});

describe('resolveListFeedFooterModel', () => {
  it('guest-gates join on activities', () => {
    const card = {
      ...buildExploreCardModel({
        id: 'activity:a1',
        kind: 'hiking',
        source: 'activity',
        title: 'Hike',
        latitude: 25,
        longitude: 56,
        path: '/activity/a1',
        activity: {
          id: 'a1',
          tenantId: 't1',
          tenantSlug: 'h',
          locationId: 'l1',
          locationName: 'Trail',
          activityType: 'hiking',
          title: 'Hike',
          description: '',
          date: '2026-10-12',
          time: '09:00',
          price: 0,
          slotsTotal: 10,
          slotsAvailable: 5,
          status: 'published',
        },
      } as ExploreMapItemDTO),
      showJoinActions: true,
      primaryCta: 'Request to join',
      secondaryCta: 'View details',
    };

    const model = resolveListFeedFooterModel(card, { isGuest: true });
    expect(model.primary.kind).toBe('guest_gate');
    expect(model.secondary).toBeNull();
  });
});
