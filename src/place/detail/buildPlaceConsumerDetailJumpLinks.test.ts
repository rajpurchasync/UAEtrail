import { describe, expect, it } from 'vitest';
import { buildPlaceConsumerDetailJumpLinks } from './buildPlaceConsumerDetailJumpLinks';

describe('buildPlaceConsumerDetailJumpLinks', () => {
  it('includes scheduled and core anchors for a trail with outings', () => {
    const links = buildPlaceConsumerDetailJumpLinks({
      kind: 'trail',
      hasAbout: true,
      showMapElevation: true,
      showSeason: false,
      showTransport: true,
      showNearby: false,
      showAmenities: false,
      showWeather: true,
      showScheduled: true,
      showRides: true,
      showGuide: true,
    });
    expect(links.map((l) => l.sectionId)).toEqual(
      expect.arrayContaining([
        'place-detail-at-a-glance',
        'place-detail-about',
        'place-detail-map-elevation',
        'place-detail-details',
        'place-detail-transport',
        'place-detail-safety',
        'place-detail-scheduled',
        'place-detail-rides',
        'place-guide',
        'place-reviews',
      ])
    );
  });
});
