import { describe, expect, it } from 'vitest';
import { extractMediaStorageKey, formatMediaUrl, formatMediaCatalogUrl } from './formatMediaUrl';

describe('formatMediaUrl', () => {
  it('extracts keys from API local/public URLs', () => {
    const key = 'tenants/t1/activities/123-photo.jpg';
    expect(extractMediaStorageKey(`/api/media/public/${key}`)).toBe(key);
    expect(extractMediaStorageKey(`/api/media/local/${key}`)).toBe(key);
  });

  it('extracts keys from direct bucket URLs', () => {
    const key = 'tenants/t1/activities/123-photo.jpg';
    expect(extractMediaStorageKey(`http://localhost:9000/uaetrail-public/${key}`)).toBe(key);
  });

  it('rewrites public media to API proxy URLs', () => {
    const key = 'tenants/t1/activities/123-photo.jpg';
    expect(formatMediaUrl(`http://localhost:9000/uaetrail-public/${key}`)).toBe(
      `/api/media/public/${key}`
    );
  });

  it('keeps resolve URLs for private media', () => {
    const url = '/api/media/resolve?key=users%2Fu1%2Favatars%2Fphoto.jpg';
    expect(formatMediaUrl(url)).toBe(url);
  });

  it('formatMediaCatalogUrl prefers -thumb.jpg siblings', () => {
    const key = 'tenants/t1/activities/123-photo.jpg';
    expect(formatMediaCatalogUrl(`/api/media/public/${key}`)).toBe(
      `/api/media/public/tenants/t1/activities/123-photo-thumb.jpg`
    );
  });
});
