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

  it('sets Deprecation and Link for /api/host/* and /me/host-status', () => {
    const headers: Record<string, string> = {};
    const res = {
      setHeader: (key: string, value: string) => {
        headers[key] = value;
      },
    };
    const next = () => undefined;

    legacyPublishingPathDeprecation(
      { originalUrl: '/api/host/activities', url: '/api/host/activities' } as never,
      res as never,
      next
    );
    expect(headers.Deprecation).toBe('true');
    expect(headers.Link).toContain('/api/operator/activities');
    expect(headers.Link).toContain('rel="alternate"');
    expect(headers.Link).not.toContain('successor-version');

    legacyPublishingPathDeprecation(
      { originalUrl: '/api/me/host-status', url: '/api/me/host-status' } as never,
      res as never,
      next
    );
    expect(headers.Link).toContain('/api/me/status');

    legacyPublishingPathDeprecation(
      { originalUrl: '/api/me/operator-status', url: '/api/me/operator-status' } as never,
      res as never,
      next
    );
    expect(headers.Link).toContain('/api/me/status');
  });
});
