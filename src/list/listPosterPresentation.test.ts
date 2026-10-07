import { describe, expect, it } from 'vitest';
import { buildExploreCardModel } from '../explore/exploreCardModel';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  formatListFeedPosterTitleLines,
  resolveBrowsePosterHeroTitle,
  resolveBrowsePosterActivityTypeLabel,
  resolveBrowsePosterLabels,
  resolveBrowsePosterPlaceLine,
  resolveBrowsePosterRequirementLabels,
  resolveBrowsePosterScheduleGrid,
} from './listPosterPresentation';
import { listCategoryResultsLabel } from './listCategoryCopy';
import { resolveListFeedFooterModel } from './listFeedFooterActions';

describe('list poster presentation', () => {
  it('joins demand highlight and date with a space', () => {
    const card = buildExploreCardModel({
      id: 'demand:d1',
      kind: 'hiking',
      source: 'demand',
      title: 'Looking',
      latitude: 25,
      longitude: 56,
      path: '/demand/d1',
      presentation: {
        kind: 'hiking',
        source: 'demand',
        emoji: '🙋',
        headline: 'Hiking on Monday',
        listTitle: 'Hiking',
        listHost: 'Member',
        primaryCta: 'Request to join',
        secondaryCta: 'Details',
        sections: {
          details: [],
          highlightName: 'Alex',
          activityHighlight: 'Hiking',
          dateHighlight: 'on Monday 14th',
        },
      },
    } as unknown as ExploreMapItemDTO);
    expect(resolveBrowsePosterHeroTitle(card)).toBe('Hiking on Monday 14th');
  });

  it('resolves activity type and requirement labels from stored requirements', () => {
    const card = buildExploreCardModel({
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
        tenantSlug: 'host',
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
        requirements: ['Women only', 'Pets allowed'],
      },
    } as ExploreMapItemDTO);
    expect(resolveBrowsePosterActivityTypeLabel(card)).toBe('Hiking');
    expect(resolveBrowsePosterRequirementLabels(card)).toEqual(['Women only', 'Pets welcome']);
    expect(resolveBrowsePosterLabels(card)).toContain('Trip');
    expect(resolveBrowsePosterLabels(card)).toContain('Hiking');
    expect(resolveBrowsePosterPlaceLine(card)).toBe('Trail');
  });

  it('does not infer pets welcome on posters when requirements omit pets', () => {
    const card = buildExploreCardModel({
      id: 'activity:a2',
      kind: 'hiking',
      source: 'activity',
      title: 'Hike',
      latitude: 25,
      longitude: 56,
      path: '/activity/a2',
      activity: {
        id: 'a2',
        tenantId: 't1',
        tenantSlug: 'host',
        locationId: 'l1',
        locationName: 'Wadi',
        activityType: 'hiking',
        title: 'Hike',
        description: '',
        date: '2026-10-12',
        time: '09:00',
        price: 0,
        slotsTotal: 10,
        slotsAvailable: 3,
        status: 'published',
        requirements: ['Difficulty: Medium'],
      },
    } as ExploreMapItemDTO);
    expect(card.requirementBadges).toContain('Pets welcome');
    expect(resolveBrowsePosterRequirementLabels(card)).not.toContain('Pets welcome');
    expect(resolveBrowsePosterRequirementLabels(card)).toContain('Medium');
  });

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
    expect(grid.spotsLabel).toBe('5 spots');
  });
});

describe('listCategoryResultsLabel', () => {
  it('uses activity count copy for trips', () => {
    expect(listCategoryResultsLabel(7, 'trips')).toBe('Found 7 activities');
    expect(listCategoryResultsLabel(1, 'trips')).toBe('Found 1 activity');
  });

  it('uses place count copy for venues', () => {
    expect(listCategoryResultsLabel(3, 'venues')).toBe('Found 3 places');
    expect(listCategoryResultsLabel(1, 'venues')).toBe('Found 1 place');
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
      viewerAccess: {
        exposure: 'redacted',
        level: 'public',
        gateReason: 'sign_in',
        canViewFullActivity: false,
        canOpenDetailPage: true,
        joinMode: 'open',
      },
    };

    const model = resolveListFeedFooterModel(card, { isGuest: true });
    expect(model.primary.kind).toBe('guest_gate');
    expect(model.secondary).toMatchObject({ kind: 'guest_gate', label: 'Message Host' });
  });
});
