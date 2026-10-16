import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ADMIN_LINKS } from '../constants';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/**
 * Canonical platform admin routes (S13-W9) — sync with `App.tsx`, `ADMIN_LINKS`, `docs/NAVIGATION.md`.
 * Notifications is routed but not in sidebar nav (ops deep link).
 */
export const ADMIN_PLATFORM_ROUTE_CATALOG: Array<{
  path: string;
  page: string;
  inSidebar: boolean;
}> = [
  { path: '/admin/overview', page: 'AdminOverview.tsx', inSidebar: true },
  { path: '/admin/areas', page: 'AdminAreas.tsx', inSidebar: true },
  { path: '/admin/places', page: 'AdminPlaces.tsx', inSidebar: true },
  { path: '/admin/activities', page: 'AdminActivities.tsx', inSidebar: true },
  { path: '/admin/facilities', page: 'AdminPlaces.tsx', inSidebar: true },
  { path: '/admin/users', page: 'AdminMembers.tsx', inSidebar: true },
  { path: '/admin/hosts', page: 'AdminOrganisations.tsx', inSidebar: true },
  { path: '/admin/groups', page: 'AdminGroups.tsx', inSidebar: true },
  { path: '/admin/shop', page: 'AdminShop.tsx', inSidebar: true },
  { path: '/admin/reports', page: 'AdminReports.tsx', inSidebar: true },
  { path: '/admin/audit-log', page: 'AdminAuditLog.tsx', inSidebar: true },
  { path: '/admin/settings', page: 'AdminSettings.tsx', inSidebar: true },
  { path: '/admin/notifications', page: 'AdminNotifications.tsx', inSidebar: false },
];

const CONSUMER_PEEK_NEEDLES = [
  /map-peek\//,
  /ActivityMapPeekHost/,
  /discoveryCardModel/,
  /buildDiscoveryCardViewModel/,
  /ExploreCardPresentation/,
  /PlaceMapPeekHost/,
];

describe('adminSurfacesAcceptance (S13-W9)', () => {
  it('W9-01: NAVIGATION.md catalogs all platform admin routes', () => {
    const nav = read('docs/NAVIGATION.md');
    const missing = ADMIN_PLATFORM_ROUTE_CATALOG.filter(({ path }) => !nav.includes(path));
    expect(missing.map((r) => r.path)).toEqual([]);
  });

  it('W9-02: App.tsx registers each admin route to its page module', () => {
    const app = read('src/App.tsx');
    const violations: string[] = [];
    for (const { path, page } of ADMIN_PLATFORM_ROUTE_CATALOG) {
      if (!app.includes(`path="${path}"`)) {
        violations.push(`missing route ${path}`);
        continue;
      }
      const component = page.replace('.tsx', '');
      if (!app.includes(`<${component}`) && !app.includes(`${component} />`)) {
        violations.push(`${path}: expected ${component} in route element`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('W9-03: admin page modules exist and use DashboardLayout shell', () => {
    const violations: string[] = [];
    for (const { page } of ADMIN_PLATFORM_ROUTE_CATALOG) {
      const rel = `src/pages/${page}`;
      if (!existsSync(join(ROOT, rel))) {
        violations.push(`missing ${rel}`);
        continue;
      }
      const source = read(rel);
      if (!source.includes('DashboardLayout')) {
        violations.push(`${rel}: missing DashboardLayout`);
      }
      if (!source.includes('ADMIN_LINKS')) {
        violations.push(`${rel}: missing ADMIN_LINKS`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('W9-04: ADMIN_LINKS sidebar paths match catalog (sidebar entries only)', () => {
    const sidebarPaths = ADMIN_PLATFORM_ROUTE_CATALOG.filter((r) => r.inSidebar).map((r) => r.path);
    expect(ADMIN_LINKS.map((link) => link.to)).toEqual(sidebarPaths);
  });

  it('W9-05: bounded-context manifest lists all Admin* pages (C25)', () => {
    const manifest = JSON.parse(read('scripts/bounded-context-manifest.json'));
    const ops = manifest.contexts.find((c: { id: string }) => c.id === 'platform_ops');
    expect(ops).toBeTruthy();
    const feRoots: string[] = ops.feRoots;
    const adminPages = readdirSync(join(ROOT, 'src/pages')).filter(
      (name) => name.startsWith('Admin') && name.endsWith('.tsx')
    );
    const missing = adminPages.filter(
      (name) => !feRoots.includes(`src/pages/${name}`)
    );
    expect(missing).toEqual([]);
  });

  it('W9-06: admin pages do not import consumer map peek / discovery card stack', () => {
    const violations: string[] = [];
    for (const { page } of ADMIN_PLATFORM_ROUTE_CATALOG) {
      const source = read(`src/pages/${page}`);
      for (const pattern of CONSUMER_PEEK_NEEDLES) {
        if (pattern.test(source)) {
          violations.push(`${page}: matches ${pattern}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
