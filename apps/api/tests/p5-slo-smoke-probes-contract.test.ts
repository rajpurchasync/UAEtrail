import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..', '..');
const SMOKE_PATH = join(ROOT, 'scripts/p5-slo-smoke.mjs');
const ROUTES_PATH = join(ROOT, 'scripts/system-audit-routes.json');
const APP_PATH = join(ROOT, 'apps/api/src/app.ts');
const AUTH_ROUTES_PATH = join(ROOT, 'apps/api/src/routes/auth.ts');
const PUBLIC_ACTIVITY_PATH = join(
  ROOT,
  'apps/api/src/routes/user/registerPublicActivityRoutes.ts'
);

const stripApiQuery = (rawPath: string): string => {
  const withoutQuery = rawPath.split('?')[0] ?? rawPath;
  return withoutQuery.replace(/^\/api/, '') || '/';
};

/**
 * P5 smoke probes must stay aligned with mounted API routes.
 * @see MIG-P5-SLO-SMOKE · scripts/p5-slo-smoke.mjs
 */
describe('P5 SLO smoke probes contract (MIG-P5-SLO-SMOKE)', () => {
  const smoke = readFileSync(SMOKE_PATH, 'utf8');
  const audit = JSON.parse(readFileSync(ROUTES_PATH, 'utf8')) as {
    endpoints: { method: string; path: string }[];
  };
  const appSource = readFileSync(APP_PATH, 'utf8');
  const authRoutes = readFileSync(AUTH_ROUTES_PATH, 'utf8');
  const publicActivityRoutes = readFileSync(PUBLIC_ACTIVITY_PATH, 'utf8');

  const auditGetPaths = new Set(
    audit.endpoints.filter((e) => e.method === 'GET').map((e) => e.path)
  );

  const consumerReadProbes = [
    '/api/explore/map',
    '/api/areas?page=1&pageSize=10',
    '/api/facilities?page=1&pageSize=10',
  ];

  it('consumer read latency probes map to GET routes in system-audit-routes.json', () => {
    expect(appSource).toMatch(/app\.get\(['"]\/health['"]/);

    const missing: string[] = [];
    for (const raw of consumerReadProbes) {
      const apiPath = stripApiQuery(raw);
      if (!auditGetPaths.has(apiPath)) {
        missing.push(apiPath);
      }
    }
    expect(missing).toEqual([]);
  });

  it('optional bbox probe is documented in the smoke script', () => {
    expect(smoke).toMatch(/P5_EXPLORE_MAP_BBOX/);
    expect(smoke).toMatch(/explore_map_bbox/);
  });

  it('join probe targets public activity RSVP and request routes', () => {
    expect(smoke).toMatch(/\/api\/activities\/\$\{activityId\}\/rsvp/);
    expect(smoke).toMatch(/\/api\/activities\/\$\{activityId\}\/requests/);
    expect(publicActivityRoutes).toMatch(/\/:id\/rsvp/);
    expect(publicActivityRoutes).toMatch(/\/:id\/requests/);
  });

  it('login probe targets auth router', () => {
    expect(smoke).toMatch(/\/api\/auth\/login/);
    expect(authRoutes).toMatch(/authRouter\.post\(['"]\/login['"]/);
  });
});
