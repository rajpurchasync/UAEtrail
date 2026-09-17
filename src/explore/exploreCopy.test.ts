import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  resolveExploreItemSource,
  sanitizeExploreLocation,
} from './exploreCopy';
import { resolveExplorePrice } from './explorePriceLabel';
import { extractExploreRequirementBadges } from './exploreRequirementBadges';
import { resolveExploreHostLabel, resolveExploreHostPersonName } from '../utils/userDisplay';

describe('resolveMapPinEmoji', () => {
  it('uses activity emojis', () => {
    expect(resolveMapPinEmoji('hiking', 'activity')).toBe('🥾');
    expect(resolveMapPinEmoji('camping', 'activity')).toBe('🏕️');
    expect(resolveMapPinEmoji('event', 'activity')).toBe('🏃');
    expect(resolveMapPinEmoji('carpool', 'activity')).toBe('🚗');
  });

  it('uses venue emojis', () => {
    expect(resolveMapPinEmoji('hiking', 'venue')).toBe('🧗');
    expect(resolveMapPinEmoji('camping', 'venue')).toBe('⛺');
  });

  it('resolves source from id prefix when source is missing', () => {
    expect(resolveExploreItemSource({ id: 'venue:abc', source: 'activity' })).toBe('activity');
    expect(
      resolveExploreItemSource({ id: 'venue:abc', source: undefined as unknown as 'activity' })
    ).toBe('venue');
    expect(
      resolveExploreItemSource({ id: 'activity:abc', source: undefined as unknown as 'activity' })
    ).toBe('activity');
  });

  it('uses car emoji for all carpool map pins', () => {
    expect(resolveMapPinEmoji('carpool', 'activity', 'to')).toBe('🚗');
    expect(resolveMapPinEmoji('carpool', 'activity', 'from')).toBe('🚗');
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

describe('resolveExploreHostLabel', () => {
  it('uses the resolved person name from the API', () => {
    expect(
      resolveExploreHostLabel({
        hostName: 'Khalid Rahman',
        tenantName: 'UAE Adventure Co',
      })
    ).toBe('Khalid');
  });

  it('falls back to Host when only tenant or role labels are available', () => {
    expect(
      resolveExploreHostLabel({
        hostName: 'Agency Guide',
        tenantName: 'UAE Adventure Co',
      })
    ).toBe('Host');
  });

  it('rejects org labels passed as hostName', () => {
    expect(
      resolveExploreHostPersonName({
        hostName: 'Desert Explorer',
        createdByName: 'Omar Al Hosani',
        tenantName: 'Desert Explorer',
      })
    ).toBe('Omar Al Hosani');
  });
});

describe('exploreHeadline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-14T10:00:00+04:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses a real host name instead of demo role labels', () => {
    expect(
      exploreHeadline({
        source: 'activity',
        kind: 'hiking',
        title: 'Summit hike',
        hostName: 'Omar Al Hosani',
        tenantName: 'Desert Explorer',
        location: 'Jebel Jais',
        date: '2026-09-12',
        time: '06:00',
      })
    ).toBe('Omar is going Hiking on Saturday 12th - Jebel Jais - Sat at 6:00');
  });

  it('formats hiking activity with host, location, time, and spots', () => {
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
    ).toBe('Sarah is going Hiking on Saturday 12th - Fujairah - Sat at 9:00 - 8 spots');
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
    ).toBe('John is going Camping on Sunday 13th - Al Qudra - Sun at 4 PM - 20 spots');
  });

  it('formats event activity without spots when none set', () => {
    expect(
      exploreHeadline({
        source: 'activity',
        kind: 'event',
        title: 'Trail Run',
        hostName: 'Alex',
        location: 'Hatta',
        date: '2026-09-12',
        time: '15:00',
      })
    ).toBe('Alex is going Other Outdoors on Saturday 12th - Hatta - Sat at 3 PM');
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
    ).toBe('Ali is offering Rideshare on Sunday 13th - Dubai to Fujairah - Sun at 1 PM (fixed)');
  });

  it('formats location catalog entries by title', () => {
    expect(
      exploreHeadline({ source: 'venue', kind: 'hiking', title: 'Hatta Loop' })
    ).toBe('Hatta Loop');
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
    ).toBe('Alex is looking for Rideshare on Sunday 13th - Dubai to Fujairah - Sun at 2 PM (flexible)');
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
    ).toBe('Sarah is looking for Morning hike on Saturday 12th - Wadi Shawka - Sat at 7:00 (flexible)');
  });

  it('formats event demand with the requester title instead of a generic category', () => {
    expect(
      exploreHeadline({
        source: 'demand',
        kind: 'event',
        title: 'Sunrise run at Kite Beach',
        hostName: 'Fatima Host',
        location: 'Kite Beach running track, Dubai',
        date: '2026-10-15',
        time: '06:30',
      })
    ).toBe(
      'Fatima is looking for Sunrise run at Kite Beach on Thursday 15th - Kite Beach running track, Dubai - Thu at 6:30 AM (flexible)'
    );
  });

  it('falls back to Other Outdoors when the demand title is generic', () => {
    expect(
      exploreHeadline({
        source: 'demand',
        kind: 'event',
        title: 'Looking for an event',
        hostName: 'Fatima Host',
        date: '2026-10-15',
      })
    ).toBe('Fatima is looking for Other Outdoors on Thursday 15th - Thu (flexible)');
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

describe('extractExploreRequirementBadges', () => {
  it('extracts audience and age badges from requirement lines', () => {
    expect(
      extractExploreRequirementBadges([
        'Open: anyone can request to join',
        'Women only',
        'Age range: 18–45',
        'No pets',
        'Instructions: Bring water',
      ])
    ).toEqual(['Women only', 'Ages 18–45', 'No pets']);
  });
});

describe('resolveExplorePrice', () => {
  it('returns free for zero price', () => {
    expect(resolveExplorePrice({ isCarpool: false, price: 0 }).badge).toBe('Free');
  });

  it('returns paid label', () => {
    expect(resolveExplorePrice({ isCarpool: false, price: 120 }).badge).toBe('Paid Event · AED 120');
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
    expect(card.listTitle).toBe('Sarah is going Hiking on Saturday 12th');
    expect(card.headline).toBe('Sarah is going Hiking on Saturday 12th - Fujairah - Sat at 9:00 - 8 spots');
    expect(buildExploreListMeta(card)).toContain('Fujairah');
    expect(card.sections.highlightName).toBe('Sarah');
    expect(card.sections.suffix).toBe(' is going ');
    expect(card.sections.activityHighlight).toBe('Hiking');
    expect(card.sections.dateHighlight).toBe(' on Saturday 12th');
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
      featuredPerson: {
        userId: 'user-1',
        displayName: 'Alex Rider',
        role: 'requester',
      },
      date: '2026-09-13',
      time: '14:00',
      fromLabel: 'Dubai',
      toLabel: 'Fujairah',
      requesterUserId: 'user-1',
    };
    const card = buildExploreCardModel(demand);
    expect(card.featuredPerson?.role).toBe('requester');
    expect(card.listTitle).toBe('Rideshare · Alex');
    expect(card.headline).toBe(
      'Alex is looking for Rideshare on Sunday 13th - Dubai to Fujairah - Sun at 2 PM (flexible)'
    );
    expect(card.routeLabel).toBe('Dubai to Fujairah');
    expect(card.secondaryCta).toBe('Message');
    expect(buildExploreListMeta(card)).toContain('Dubai to Fujairah');
    expect(card.sections.highlightName).toBe('Alex');
    expect(card.sections.listTitle).toBe('Rideshare · Alex');
    expect(card.sections.listWhen).toContain('Sun');
  });
});
