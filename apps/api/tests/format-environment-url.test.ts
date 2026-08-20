import { describe, expect, it } from 'vitest';
import { formatEnvironmentUrl } from '../src/lib/format-environment-url.js';

describe('formatEnvironmentUrl', () => {
  it('rewrites MinIO Docker hosts using S3_PUBLIC_URL', () => {
    const signed = 'http://minio:9000/uaetrail-private/users/a/avatars/x.jpg?X-Amz-Signature=abc';
    expect(formatEnvironmentUrl(signed, 'http://localhost:9000')).toBe(
      'http://localhost:9000/uaetrail-private/users/a/avatars/x.jpg?X-Amz-Signature=abc'
    );
  });

  it('leaves relative and production URLs unchanged', () => {
    expect(formatEnvironmentUrl('/api/v1/media/local/key', 'http://localhost:9000')).toBe(
      '/api/v1/media/local/key'
    );
    expect(
      formatEnvironmentUrl('https://uaetrail-public.s3.amazonaws.com/photo.jpg', 'http://localhost:9000')
    ).toBe('https://uaetrail-public.s3.amazonaws.com/photo.jpg');
  });
});
