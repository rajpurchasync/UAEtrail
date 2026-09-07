import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreCardModel } from './exploreCardModel';
import { exploreHeadline, resolveMapPinEmoji } from './exploreCopy';
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

describe('exploreHeadline', () => {
  it('formats hiking activity', () => {
    expect(
      exploreHeadline({
        source: 'activity',
        kind: 'hiking',
        title: 'Wadi Shawka',
        hostName: 'Sarah Guide',
        date: '2026-09-12',
      })
    ).toContain('Sarah is going Hiking on');
  });

  it('formats event activity', () => {
    expect(
      exploreHeadline({
        source: 'activity',
        kind: 'event',
        title: 'Sunrise Run',
        hostName: 'Omar Ali',
        date: '2026-09-14',
      })
    ).toContain('hosting “Sunrise Run”');
  });

  it('formats carpool activity', () => {
    expect(
      exploreHeadline({
        source: 'activity',
        kind: 'carpool',
        title: 'Ride to RAK',
        hostName: 'Ali',
        date: '2026-09-10',
        fromLabel: 'Dubai Marina',
        toLabel: 'Jebel Jais',
      })
    ).toContain('carpooling Dubai Marina → Jebel Jais');
  });

  it('formats venue spots', () => {
    expect(
      exploreHeadline({ source: 'venue', kind: 'hiking', title: 'Hatta Loop' })
    ).toBe('Hiking Spot');
    expect(
      exploreHeadline({ source: 'venue', kind: 'camping', title: 'Fossil Rock' })
    ).toBe('Camping Spot');
  });

  it('formats shop listing', () => {
    expect(
      exploreHeadline({ source: 'shop', kind: 'shop', title: 'Desert Gear Co' })
    ).toBe('Desert Gear Co');
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
    title: 'Wadi Shawka Community Hike',
    subtitle: 'Wadi Shawka Loop',
    latitude: 25.3,
    longitude: 56.1,
    path: '/activity/1',
    hostName: 'Guide Person',
    date: '2026-09-12',
    slotsAvailable: 8,
    slotsTotal: 20,
    activity: {
      id: '1',
      tenantId: 't',
      tenantSlug: 'host',
      locationId: 'loc',
      locationName: 'Wadi Shawka Loop',
      activityType: 'hiking',
      title: 'Wadi Shawka Community Hike',
      description: '',
      date: '2026-09-12',
      time: '09:00',
      price: 0,
      slotsTotal: 20,
      slotsAvailable: 8,
      status: 'published',
    },
  };

  it('builds activity card with join actions', () => {
    const card = buildExploreCardModel(hikingActivity);
    expect(card.showJoinActions).toBe(true);
    expect(card.primaryCta).toBe('Request to join');
    expect(card.price?.badge).toBe('Free');
    expect(card.headline).toContain('going Hiking');
  });
});
