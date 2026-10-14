import { describe, expect, it } from 'vitest';
import { activityPublicMetaDescription, buildActivityEventJsonLd } from './activity-public-seo.js';

describe('activity public seo', () => {
  it('builds region-focused meta description', () => {
    expect(
      activityPublicMetaDescription({
        activityType: 'hiking',
        title: 'Sunrise hike',
        locationName: 'Wadi',
        region: 'Dubai',
      })
    ).toContain('Dubai');
  });

  it('does not leak meeting coordinates in JSON-LD', () => {
    const schema = buildActivityEventJsonLd(
      {
        id: 'a1',
        title: 'Sunrise hike',
        activityType: 'hiking',
        locationName: 'Secret parking',
        region: 'Dubai',
        date: '2026-11-01',
        time: '06:00',
        price: 0,
        slotsAvailable: 5,
        description: 'Gate code 1234',
        meetingPoint: 'hidden',
      } as never,
      'https://uaetrail.com'
    );
    const location = schema.location as { name?: string };
    expect(location.name).toBe('Dubai');
    expect(JSON.stringify(schema)).not.toContain('Gate code');
    expect(schema.eventStatus).toBe('https://schema.org/EventScheduled');
  });
});
