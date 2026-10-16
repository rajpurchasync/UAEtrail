import { describe, expect, it } from 'vitest';
import { locationHasRegistryCoverImage } from '../src/lib/catalog-registry-cover.js';

describe('catalog registry cover image', () => {
  it('requires non-empty images[0]', () => {
    expect(locationHasRegistryCoverImage({ images: ['https://cdn.example/cover.jpg'] })).toBe(true);
    expect(locationHasRegistryCoverImage({ images: [] })).toBe(false);
    expect(locationHasRegistryCoverImage({ images: [''] })).toBe(false);
  });
});
