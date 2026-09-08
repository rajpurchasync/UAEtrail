import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreCardModel, buildExploreListMeta } from './exploreCardModel';
import {
  buildExploreRouteLabel,
  buildExploreSpotsSegment,
  buildExploreListWhen,
  buildExploreWhenSegment,
  exploreHeadline,
  formatExploreDayShort,
  formatExploreTime,
  formatPlanPhrase,
  resolveMapPinEmoji,
  sanitizeExploreLocation,
} from './exploreCopy';
import { resolveExplorePrice } from './explorePriceLabel';

describe('resolveMapPinEmoji', () => {
  it('uses activity emojis', () => {
    expect(resolveMapPinEmoji('hiking', 'activity')).toBe('🥾');
    expect(resolveMapPinEmoji('camping', 'activity')).toBe('🏕️');
    expect(resolveMapPinEmoji('event', 'activity')).toBe('🏃');
    expect(resolveMapPinEmoji('carpool', 'activity')).toBe('🚗');
  });

  it('uses venue emojis', () => {
    expect(resolveMapPinEmoji('hiking', 'venue')).toBe('⛰️');
    expect(resolveMapPinEmoji('camping', 'venue')).toBe('⛺');
  });

  it('uses carpool destination emoji', () => {
    expect(resolveMapPinEmoji('carpool', 'activity', 'to')).toBe('🏁');
  });
});

describe('formatPlanPhrase', () => {
  it('turns descriptive titles into natural plan phrases', () => {
    expect(formatPlanPhrase('See sunrise at Kite Beach', 'event')).toBe('to see sunrise at Kite Beach');
  });

  it('falls back for auto-generated hiking titles', () => {
    expect(formatPlanPhrase('Hiking today', 'hiking')).toBe('for a hike');
  });
});

describe('formatExploreDayShort', () => {
  it('returns short weekday names', () => {
    expect(formatExploreDayShort('2026-09-12')).toBe('Sat');
    expect(formatExploreDayShort('2026-09-13')).toBe('Sun');
  });
});

describe('formatExploreTime', () => {
  it('formats morning times with colon', () => {
    expect(formatExploreTime('09:00')).toBe('9:00');
  });

  it('formats afternoon times compactly', () => {
    expect(formatExploreTime('16:00')).toBe('4 PM');
    expect(formatExploreTime('14:00')).toBe('2 PM');
  });
});

describe('exploreHeadline', () => {
  it('formats hiking activity as title by host with location, time, and spots', () => {
    expect(
      exploreHeadline({
        source: 'activity',
        kind: 'hiking',
        title: 'Sunrise Hike',
        hostName: 'Sarah',
        location: 'Fujairah',
        date: '2026-09-12',
        time: '09:00',
        slotsAvailable: 8,
        slotsTotal: 20,
      })
    ).toBe('Sunrise Hike by Sarah - Fujairah - Sat at 9:00 - 8 spots');
  });

  it('formats camping activity', () => {
    expect(
      exploreHeadline({
        source: 'activity',
        kind: 'camping',
        title: 'Al Qudra camping',
        hostName: 'John',
        location: 'Al Qudra',
        date: '2026-09-13',
        time: '16:00',
        slotsTotal: 20,
      })
    ).toBe('Al Qudra camping by John - Al Qudra - Sun at 4 PM - 20 spots');
  });

  it('formats event activity without spots when none set', () => {
    expect(
      exploreHeadline({
        source: 'activity',
        kind: 'event',
        title: 'Trail Run',
        hostName: 'desert Adventure',
        location: 'Hatta',
        date: '2026-09-12',
        time: '15:00',
      })
    ).toBe('Trail Run by desert Adventure - Hatta - Sat at 3 PM');
  });

  it('formats carpool supply with route, time, and fixed tag', () => {
    expect(
      exploreHeadline({
        source: 'activity',
        kind: 'carpool',
        title: 'Ride to Fujairah',
        hostName: 'Ali',
        date: '2026-09-13',
        time: '13:00',
        fromLabel: 'Dubai',
        toLabel: 'Fujairah',
      })
    ).toBe('Ali is offering Rideshare - Dubai to Fujairah - Sun at 1 PM (fixed)');
  });

  it('formats venue spots', () => {
    expect(
      exploreHeadline({ source: 'venue', kind: 'hiking', title: 'Hatta Loop' })
    ).toBe('Hiking Spot');
  });

  it('formats shop listing', () => {
    expect(
      exploreHeadline({ source: 'shop', kind: 'shop', title: 'Desert Gear Co' })
    ).toBe('Desert Gear Co');
  });

  it('formats rideshare demand with route and flexible tag', () => {
    expect(
      exploreHeadline({
        source: 'demand',
        kind: 'carpool',
        title: 'Ride share request',
        hostName: 'Alex Rider',
        date: '2026-09-13',
        time: '14:00',
        fromLabel: 'Dubai',
        toLabel: 'Fujairah',
      })
    ).toBe('Alex is looking for Rideshare - Dubai to Fujairah - Sun at 2 PM (flexible)');
  });

  it('formats hiking demand with location and flexible tag', () => {
    expect(
      exploreHeadline({
        source: 'demand',
        kind: 'hiking',
        title: 'Morning hike',
        hostName: 'Sarah Host',
        location: 'Wadi Shawka',
        date: '2026-09-12',
        time: '07:00',
      })
    ).toBe('Sarah is looking for Hiking - Wadi Shawka - Sat at 7:00 (flexible)');
  });
});

describe('buildExploreRouteLabel', () => {
  it('returns route for carpool only', () => {
    expect(buildExploreRouteLabel('Dubai', 'Fujairah', 'carpool')).toBe('Dubai to Fujairah');
    expect(buildExploreRouteLabel('Dubai', 'Fujairah', 'hiking')).toBeNull();
  });
});

describe('buildExploreWhenSegment', () => {
  it('adds flexible suffix for demands', () => {
    expect(buildExploreWhenSegment('2026-09-13', '14:00', 'flexible')).toBe('Sun at 2 PM (flexible)');
  });

  it('adds fixed suffix for carpool supply', () => {
    expect(buildExploreWhenSegment('2026-09-13', '13:00', 'fixed')).toBe('Sun at 1 PM (fixed)');
  });
});

describe('sanitizeExploreLocation', () => {
  it('drops coordinate map spot labels', () => {
    expect(sanitizeExploreLocation('Map spot 25.733416, 56.006241')).toBeNull();
    expect(sanitizeExploreLocation('Hatta Dam Loop')).toBe('Hatta Dam Loop');
  });
});

describe('buildExploreListWhen', () => {
  it('uses compact day labels', () => {
    expect(buildExploreListWhen('2026-09-13', '14:00')).toBe('Sun · 2 PM');
  });
});

describe('buildExploreSpotsSegment', () => {
  it('prefers available spots', () => {
    expect(buildExploreSpotsSegment(8, 20)).toBe('8 spots');
    expect(buildExploreSpotsSegment(0, 20)).toBe('20 spots');
  });
});

describe('resolveExplorePrice', () => {
  it('returns free for zero price', () => {
    expect(resolveExplorePrice({ isCarpool: false, price: 0 }).badge).toBe('Free');
  });

  it('returns paid label', () => {
    expect(resolveExplorePrice({ isCarpool: false, price: 120 }).badge).toBe('Paid · AED 120');
  });

  it('returns shared carpool label', () => {
    expect(
      resolveExplorePrice({ isCarpool: true, carPoolFree: false, carPoolPriceAed: 35 }).badge
    ).toBe('Shared · AED 35/seat');
  });
});

describe('buildExploreCardModel', () => {
  const hikingActivity: ExploreMapItemDTO = {
    id: 'activity:1',
    kind: 'hiking',
    source: 'activity',
    title: 'Sunrise Hike',
    subtitle: 'Fujairah',
    latitude: 25.3,
    longitude: 56.1,
    path: '/activity/1',
    hostName: 'Sarah',
    date: '2026-09-12',
    time: '09:00',
    slotsAvailable: 8,
    slotsTotal: 20,
    participantPreviews: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }],
    activity: {
      id: '1',
      tenantId: 't',
      tenantSlug: 'host',
      locationId: 'loc',
      locationName: 'Fujairah',
      activityType: 'hiking',
      title: 'Sunrise Hike',
      description: '',
      date: '2026-09-12',
      time: '09:00',
      price: 0,
      slotsTotal: 20,
      slotsAvailable: 8,
      status: 'published',
    },
  };

  it('builds one-line activity card', () => {
    const card = buildExploreCardModel(hikingActivity);
    expect(card.showJoinActions).toBe(true);
    expect(card.primaryCta).toBe('Request to join');
    expect(card.price?.badge).toBe('Free');
    expect(card.listTitle).toBe('Sunrise Hike by Sarah - Fujairah - Sat at 9:00 - 8 spots');
    expect(card.headline).toBe(card.listTitle);
    expect(buildExploreListMeta(card)).toContain('Fujairah');
    expect(card.sections.titleText).toBe('Sunrise Hike');
    expect(card.sections.hostName).toBe('Sarah');
    expect(card.sections.listTitle).toBe('Sunrise Hike');
    expect(card.sections.listWhen).toContain('Sat');
    expect(card.sections.listGoing).toBe('12 going');
  });

  it('builds one-line demand card', () => {
    const demand: ExploreMapItemDTO = {
      id: 'demand:1',
      kind: 'carpool',
      source: 'demand',
      title: 'Ride share request',
      subtitle: 'Dubai to Fujairah',
      latitude: 25.3,
      longitude: 55.3,
      path: '/demand/1',
      hostName: 'Alex Rider',
      date: '2026-09-13',
      time: '14:00',
      fromLabel: 'Dubai',
      toLabel: 'Fujairah',
      requesterUserId: 'user-1',
    };
    const card = buildExploreCardModel(demand);
    expect(card.listTitle).toBe(
      'Alex is looking for Rideshare - Dubai to Fujairah - Sun at 2 PM (flexible)'
    );
    expect(card.routeLabel).toBe('Dubai to Fujairah');
    expect(card.secondaryCta).toBe('Message');
    expect(buildExploreListMeta(card)).toContain('Dubai to Fujairah');
    expect(card.sections.highlightName).toBe('Alex');
    expect(card.sections.listTitle).toBe('Ride share request');
    expect(card.sections.listWhen).toContain('Sun');
  });
});
