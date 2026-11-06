import { describe, expect, it } from 'vitest';
import { deriveMediaThumbStorageKey } from '../src/lib/media-thumb.js';

describe('media thumb keys (W2 image variants)', () => {
  it('derives sibling -thumb.jpg keys', () => {
    expect(deriveMediaThumbStorageKey('tenants/t1/activities/photo.jpg')).toBe(
      'tenants/t1/activities/photo-thumb.jpg'
    );
  });
});
