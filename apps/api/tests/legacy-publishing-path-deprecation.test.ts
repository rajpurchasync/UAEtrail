import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  legacyPublishingPathDeprecation,
} from '../src/middleware/legacy-publishing-path-deprecation.js';

describe('legacyPublishingPathDeprecation', () => {
  it('is registered on the API router before route mounts', () => {
    const index = readFileSync(join(process.cwd(), 'src/routes/index.ts'), 'utf8');
    expect(index).toMatch(/legacyPublishingPathDeprecation/);
    expect(index).toMatch(/apiRouter\.use\(legacyPublishingPathDeprecation\)/);
    expect(index).toMatch(/legacyHostApiRewrite/);
  });

  it('sets Deprecation and Link for /api/v1/host/* and /me/host-status', () => {
    const headers: Record<string, string> = {};
    const res = {
      setHeader: (key: string, value: string) => {
        headers[key] = value;
      },
    };
    const next = () => undefined;

    legacyPublishingPathDeprecation(
      { originalUrl: '/api/v1/host/activities', url: '/api/v1/host/activities' } as never,
      res as never,
      next
    );
    expect(headers.Deprecation).toBe('true');
    expect(headers.Link).toContain('/api/v1/operator/activities');
    expect(headers.Link).toContain('rel="alternate"');
    expect(headers.Link).not.toContain('successor-version');

    legacyPublishingPathDeprecation(
      { originalUrl: '/api/v1/me/host-status', url: '/api/v1/me/host-status' } as never,
      res as never,
      next
    );
    expect(headers.Link).toContain('/api/v1/me/status');

    legacyPublishingPathDeprecation(
      { originalUrl: '/api/v1/me/operator-status', url: '/api/v1/me/operator-status' } as never,
      res as never,
      next
    );
    expect(headers.Link).toContain('/api/v1/me/status');
  });
});
