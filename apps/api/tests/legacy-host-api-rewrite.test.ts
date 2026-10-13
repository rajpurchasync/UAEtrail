import { describe, expect, it } from 'vitest';
import { legacyHostApiRewrite } from '../src/middleware/legacy-host-api-rewrite.js';

describe('legacyHostApiRewrite', () => {
  it('rewrites /host/* to /operator/* on the API router', () => {
    const req = { path: '/host/activities', url: '/host/activities?page=1' } as {
      path: string;
      url: string;
    };
    legacyHostApiRewrite(req as never, {} as never, () => undefined);
    expect(req.url).toBe('/operator/activities?page=1');
  });

  it('leaves /operator paths unchanged', () => {
    const req = { path: '/operator/team', url: '/operator/team' } as {
      path: string;
      url: string;
    };
    legacyHostApiRewrite(req as never, {} as never, () => undefined);
    expect(req.url).toBe('/operator/team');
  });
});
