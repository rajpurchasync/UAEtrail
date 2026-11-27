import { describe, expect, it } from 'vitest';
import { buildPlaceConsumerDetailJumpLinks } from './buildPlaceConsumerDetailJumpLinks';

describe('buildPlaceConsumerDetailJumpLinks', () => {
  it('includes scheduled and core anchors for a trail with outings', () => {
    const links = buildPlaceConsumerDetailJumpLinks({
      hasAbout: true,
      showSeason: false,
      showTransport: true,
      showNearby: false,
      showScheduled: true,
      showGuide: true,
    });
    expect(links.map((l) => l.sectionId)).toEqual(
      expect.arrayContaining([
        'place-detail-at-a-glance',
        'place-detail-about',
        'place-detail-transport',
        'place-detail-scheduled',
        'place-guide',
        'place-reviews',
      ])
    );
  });

  it('guest preview stops after overview', () => {
    expect(
      buildPlaceConsumerDetailJumpLinks({
        guestPreview: true,
        hasAbout: true,
        showSeason: true,
        showTransport: true,
        showNearby: true,
        showScheduled: true,
        showGuide: true,
      }).map((l) => l.sectionId)
    ).toEqual(['place-detail-at-a-glance', 'place-detail-about']);
  });
});