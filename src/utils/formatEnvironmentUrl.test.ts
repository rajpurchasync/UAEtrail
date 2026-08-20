import { describe, expect, it } from 'vitest';
import { formatEnvironmentUrl, rewriteEnvironmentUrls } from './formatEnvironmentUrl';

describe('formatEnvironmentUrl', () => {
  it('rewrites MinIO Docker host to the browser hostname and keeps port/path/query', () => {
    const input = 'http://minio:9000/uaetrail-assets/uploads/photo.jpg?X-Amz-Signature=abc';
    const result = formatEnvironmentUrl(input, '192.168.1.24');
    expect(result).toBe('http://192.168.1.24:9000/uaetrail-assets/uploads/photo.jpg?X-Amz-Signature=abc');
  });

  it('rewrites Grafana and Prometheus Docker hosts', () => {
    expect(formatEnvironmentUrl('http://grafana:3000/d/uaetrail', 'localhost')).toBe(
      'http://localhost:3000/d/uaetrail'
    );
    expect(formatEnvironmentUrl('http://prometheus:9090/graph', '10.0.0.8')).toBe(
      'http://10.0.0.8:9090/graph'
    );
  });

  it('leaves production S3 and live Grafana URLs unchanged', () => {
    expect(formatEnvironmentUrl('https://uaetrail-assets.s3.amazonaws.com/photo.jpg', 'localhost')).toBe(
      'https://uaetrail-assets.s3.amazonaws.com/photo.jpg'
    );
    expect(formatEnvironmentUrl('https://grafana.uaetrail.ae/d/ops', 'localhost')).toBe(
      'https://grafana.uaetrail.ae/d/ops'
    );
  });

  it('leaves relative, blob, and data URLs unchanged', () => {
    expect(formatEnvironmentUrl('/api/v1/media/local/key')).toBe('/api/v1/media/local/key');
    expect(formatEnvironmentUrl('blob:http://localhost:5175/abc')).toBe('blob:http://localhost:5175/abc');
    expect(formatEnvironmentUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
  });

  it('returns the original string when URL parsing fails', () => {
    expect(formatEnvironmentUrl('http://minio:not-a-port')).toBe('http://minio:not-a-port');
  });
});

describe('rewriteEnvironmentUrls', () => {
  it('rewrites nested upload and image URLs in API payloads', () => {
    const payload = rewriteEnvironmentUrls(
      {
        data: {
          uploadUrl: 'http://minio:9000/bucket/key',
          publicUrl: 'http://minio:9000/bucket/key',
          images: ['https://images.unsplash.com/photo.jpg', 'http://minio:9000/bucket/a.png'],
        },
      },
    );

    expect(payload.data.uploadUrl.startsWith('http://minio:9000')).toBe(false);
    expect(payload.data.images[0]).toBe('https://images.unsplash.com/photo.jpg');
    expect(payload.data.images[1]).not.toContain('://minio:');
  });
});
