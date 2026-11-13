import { describe, expect, it } from 'vitest';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { collectActivityDetailHeroPhotos } from './collectActivityDetailHeroPhotos';

describe('collectActivityDetailHeroPhotos', () => {
  it('prefers outing photos then venue images up to five', () => {
    const activity = {
      id: 'a1',
      locationId: 'loc-1',
      title: 'Dawn hike',
      activityType: 'hiking',
      images: ['https://cdn.example/1.jpg', 'https://cdn.example/2.jpg'],
      location: {
        id: 'loc-1',
        name: 'Hatta Trail',
        activityType: 'hiking',
        images: ['https://cdn.example/trail.jpg'],
      },
    } as ActivityDetailDTO;
    const photos = collectActivityDetailHeroPhotos(activity);
    expect(photos.map((p) => p.src)).toEqual([
      'https://cdn.example/1.jpg',
      'https://cdn.example/2.jpg',
      'https://cdn.example/trail.jpg',
    ]);
    expect(photos[0]?.href).toContain('/activity/');
    expect(photos[2]?.href).toContain('/place/');
  });

  it('always returns at least one slide when outing has no images yet (guest redacted)', () => {
    const activity = {
      id: 'a2',
      title: 'Baqal Caves',
      activityType: 'hiking',
      locationName: 'Jebel Jais',
    } as ActivityDetailDTO;
    const photos = collectActivityDetailHeroPhotos(activity);
    expect(photos).toHaveLength(1);
    expect(photos[0]?.src).toMatch(/^https:\/\//);
    expect(photos[0]?.href).toContain('/activity/a2');
  });
});
