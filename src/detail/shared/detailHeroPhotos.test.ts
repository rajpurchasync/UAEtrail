import { describe, expect, it } from 'vitest';
import {
  collectDetailHeroPhotos,
  detailHeroSourceLinkVisible,
  pickRandomHeroPhotos,
} from './detailHeroPhotos';

describe('collectDetailHeroPhotos', () => {
  it('keeps unique uploaded urls and caps per entity', () => {
    const photos = collectDetailHeroPhotos([
      {
        srcs: [' https://cdn.example/a.jpg ', 'https://cdn.example/b.jpg', 'https://cdn.example/c.jpg'],
        title: 'Hatta Dam',
        kindLabel: 'Trail',
        href: '/place/1',
      },
      {
        srcs: ['https://cdn.example/a.jpg', 'https://cdn.example/d.jpg'],
        title: 'Dawn hike',
        kindLabel: 'Outing',
        href: '/activity/2',
      },
      { srcs: ['  '], title: 'Skip', kindLabel: 'Area', href: '/area/x' },
    ]);
    expect(photos.map((p) => p.src)).toEqual([
      'https://cdn.example/a.jpg',
      'https://cdn.example/b.jpg',
      'https://cdn.example/c.jpg',
      'https://cdn.example/d.jpg',
    ]);
    expect(photos[0]?.title).toBe('Hatta Dam');
    expect(photos[3]?.kindLabel).toBe('Outing');
  });

  it('caps collection at five photos', () => {
    const pool = collectDetailHeroPhotos(
      Array.from({ length: 8 }, (_, i) => ({
        srcs: [`https://cdn.example/${i}.jpg`],
        title: `Place ${i}`,
        kindLabel: 'Place',
        href: `/place/${i}`,
      }))
    );
    expect(pool).toHaveLength(5);
    let calls = 0;
    const picked = pickRandomHeroPhotos(pool, 5, () => {
      calls += 1;
      return 0;
    });
    expect(picked).toHaveLength(5);
    expect(calls).toBe(0);
  });
});

describe('detailHeroSourceLinkVisible', () => {
  it('hides chip when photo href is the same page', () => {
    expect(
      detailHeroSourceLinkVisible('/camp/fossil-rock-desert-camp', '/camp/fossil-rock-desert-camp')
    ).toBe(false);
  });

  it('hides chip for place route aliases with the same id', () => {
    expect(
      detailHeroSourceLinkVisible('/place/fossil-rock-desert-camp', '/camp/fossil-rock-desert-camp')
    ).toBe(false);
  });

  it('shows chip for linked outings on a place page', () => {
    expect(detailHeroSourceLinkVisible('/activity/abc', '/camp/fossil-rock-desert-camp')).toBe(true);
  });
});
