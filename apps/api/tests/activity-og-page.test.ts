import { describe, expect, it } from 'vitest';
import { buildActivityOgDescription, buildActivityOgHtml } from '../src/lib/activity-og-page.js';

describe('activity og page', () => {
  it('embeds title, description, and image in html', () => {
    const html = buildActivityOgHtml({
      siteOrigin: 'https://uaetrail.com',
      canonicalPath: '/activity/act-1',
      description: 'Join Friday hike in Dubai on UAE Trail.',
      indexable: true,
      activity: {
        id: 'act-1',
        title: 'Friday hike',
        activityType: 'hiking',
        locationName: 'Wadi',
        region: 'Dubai',
        date: '2026-11-01',
        time: '06:00',
        images: ['https://cdn.example/hero.jpg'],
      } as never,
    });

    expect(html).toContain('og:title');
    expect(html).toContain('Friday hike');
    expect(html).toContain('https://cdn.example/hero.jpg');
    expect(html).toContain('https://uaetrail.com/activity/act-1');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"@type":"Event"');
    expect(html).toContain('index, follow');
    expect(html).not.toContain('http-equiv="refresh"');
  });

  it('builds public description copy', () => {
    expect(
      buildActivityOgDescription({
        activityType: 'hiking',
        title: 'Sunrise ridge',
        locationName: 'Jebel',
        region: 'RAK',
      })
    ).toContain('RAK');
  });
});
