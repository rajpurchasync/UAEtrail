import { describe, expect, it } from 'vitest';
import { publicAssetUrl } from '../src/lib/s3.js';

describe('publicAssetUrl', () => {
  it('returns API proxy URL for public event images', () => {
    const key = 'tenants/t1/events/123-photo.jpg';
    expect(publicAssetUrl(key, 'event')).toBe(`/api/v1/media/public/${key}`);
  });

  it('returns resolve URL for private avatars', () => {
    const key = 'users/u1/avatars/photo.jpg';
    expect(publicAssetUrl(key, 'avatar')).toBe(`/api/v1/media/resolve?key=${encodeURIComponent(key)}`);
  });
});
