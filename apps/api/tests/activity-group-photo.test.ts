import { describe, expect, it } from 'vitest';
import { resolveActivityPrimaryImageUrl } from '../src/lib/activity-group-photo.js';

describe('resolveActivityPrimaryImageUrl', () => {
  it('prefers activity images then location then banner', () => {
    expect(
      resolveActivityPrimaryImageUrl({
        images: ['https://cdn/a.jpg'],
        bannerUrl: 'https://cdn/banner.jpg',
      })
    ).toBe('https://cdn/a.jpg');

    expect(
      resolveActivityPrimaryImageUrl({
        images: [],
        location: { images: ['https://cdn/loc.jpg'] },
        bannerUrl: 'https://cdn/banner.jpg',
      })
    ).toBe('https://cdn/loc.jpg');

    expect(
      resolveActivityPrimaryImageUrl({
        images: null,
        bannerUrl: 'https://cdn/banner.jpg',
      })
    ).toBe('https://cdn/banner.jpg');
  });
});
