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
  element: string;
  inSidebar: boolean;
}> = [
  { path: '/admin/overview', page: 'admin/Overview.tsx', element: 'AdminOverview', inSidebar: true },
  { path: '/admin/activities', page: 'admin/Activities.tsx', element: 'AdminActivities', inSidebar: true },
  { path: '/admin/areas', page: 'admin/Areas.tsx', element: 'AdminAreas', inSidebar: true },
  { path: '/admin/places', page: 'admin/Places.tsx', element: 'AdminPlaces', inSidebar: true },
  { path: '/admin/facilities', page: 'admin/Places.tsx', element: 'AdminPlaces', inSidebar: true },
  { path: '/admin/users', page: 'admin/Members.tsx', element: 'AdminMembers', inSidebar: true },
  { path: '/admin/hosts', page: 'admin/Organisations.tsx', element: 'AdminOrganisations', inSidebar: true },
  { path: '/admin/groups', page: 'admin/Groups.tsx', element: 'AdminGroups', inSidebar: true },
  { path: '/admin/reports', page: 'admin/Reports.tsx', element: 'AdminReports', inSidebar: true },
  { path: '/admin/audit-log', page: 'admin/AuditLog.tsx', element: 'AdminAuditLog', inSidebar: true },
  { path: '/admin/settings', page: 'admin/Settings.tsx', element: 'AdminSettings', inSidebar: true },
  { path: '/admin/account', page: 'admin/Account.tsx', element: 'AdminAccount', inSidebar: true },
  { path: '/admin/notifications', page: 'admin/Notifications.tsx', element: 'AdminNotifications', inSidebar: false },
];

const CONSUMER_PEEK_NEEDLES = [
  /map-peek\//,
  /ActivityMapPeekHost/,
  /discoveryCardModel/,
  /buildDiscoveryCardViewModel/,
  /DiscoveryCardPresentation/,
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
    for (const { path, page, element } of ADMIN_PLATFORM_ROUTE_CATALOG) {
      if (!app.includes(`path="${path}"`)) {
        violations.push(`missing route ${path}`);
        continue;
      }
      if (!app.includes(`./pages/${page.replace(/\.tsx$/, '')}`)) {
        violations.push(`${path}: expected import ./pages/${page}`);
      }
      if (!app.includes(`<${element}`) && !app.includes(`${element} />`)) {
        violations.push(`${path}: expected ${element} in route element`);
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

  it('W9-05: bounded-context manifest lists all admin pages (C25)', () => {
    const manifest = JSON.parse(read('scripts/bounded-context-manifest.json'));
    const ops = manifest.contexts.find((c: { id: string }) => c.id === 'platform_ops');
    expect(ops).toBeTruthy();
    const feRoots: string[] = ops.feRoots;
    const adminPages = readdirSync(join(ROOT, 'src/pages/admin')).filter((name) => name.endsWith('.tsx'));
    const missing = adminPages.filter((name) => !feRoots.includes(`src/pages/admin/${name}`));
    expect(missing).toEqual([]);
  });

  it('W9-07: admin pages live under src/pages/admin/ without Admin filename prefix', () => {
    const rootAdmin = readdirSync(join(ROOT, 'src/pages')).filter(
      (name) => name.startsWith('Admin') && name.endsWith('.tsx')
    );
    expect(rootAdmin).toEqual([]);
    const prefixed = readdirSync(join(ROOT, 'src/pages/admin')).filter((name) => name.startsWith('Admin'));
    expect(prefixed).toEqual([]);
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
