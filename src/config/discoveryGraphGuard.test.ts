import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('discoveryGraphGuard (DMCP Phase 3)', () => {
  it('DISC-03-01: GW-7 retired list facade — import discoveryRuntime directly', () => {
    expect(existsSync(join(process.cwd(), 'src/list/browse/discoveryListRuntime.ts'))).toBe(false);
    expect(read('src/explore/discoveryRuntime.ts')).toMatch(/fetchExploreMapItems/);
  });

  it('DISC-03-02: discoveryRuntime stays projection barrel (no list imports)', () => {
    const runtime = read('src/explore/discoveryRuntime.ts');
    expect(runtime).not.toMatch(/from ['"]\.\.\/list\//);
    expect(runtime).not.toMatch(/from ['"]\.\/routing\.ts/);
    expect(runtime).toMatch(/fetchExploreMapItems/);
  });

  it('DISC-03-03: list does not import explore/routing.ts', () => {
    const violations: string[] = [];
    const listRoot = join(process.cwd(), 'src/list');
    const walk = (dir: string) => {
      for (const ent of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === 'node_modules') continue;
          walk(full);
        } else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) {
          const rel = relative(process.cwd(), full).replace(/\\/g, '/');
          const content = read(rel);
          if (/from ['"]\.\.\/explore\/routing/.test(content)) violations.push(rel);
          if (/from ['"]\.\.\/\.\.\/explore\/routing/.test(content)) violations.push(rel);
        }
      }
    };
    walk(listRoot);
    expect(violations).toEqual([]);
  });

  it('DISC-03-04: import audit budget enforced', () => {
    const audit = JSON.parse(read('scripts/governance/discovery-import-audit.json'));
    const max = audit.limits?.maxListExploreImports ?? 25;
    const count = audit.listExploreImports ?? audit.matrix?.['src/list']?.explore ?? 999;
    expect(count).toBeLessThanOrEqual(max);
  });

  it('DISC-03-06: GW-7 browse leaves use discoveryPortExplore facades', () => {
    expect(read('src/list/browse/browseListFilters.ts')).toMatch(/discovery\/discoveryPortExplore/);
    expect(read('src/list/browse/browseListUrlState.ts')).toMatch(/discoveryPortExploreOptionalFilterWire/);
    expect(read('src/list/browse/browseListUrlState.ts')).toMatch(/discoveryPortExploreRouting/);
    expect(existsSync(join(process.cwd(), 'src/discovery/discoveryPortExploreRuntime.ts'))).toBe(false);
  });

  it('DISC-03-07: W90 retired discoveryPortExploreBrowse — BrowseHooks + BrowseUrl only', () => {
    const discovery = join(process.cwd(), 'src/discovery');
    expect(existsSync(join(discovery, 'discoveryPortExploreBrowse.ts'))).toBe(false);
    expect(existsSync(join(discovery, 'discoveryPortExploreBrowseHooks.ts'))).toBe(true);
    expect(existsSync(join(discovery, 'discoveryPortExploreBrowseUrl.ts'))).toBe(true);
    expect(read('src/list/browse/browseListCopy.ts')).toMatch(/discoveryPortExploreCatalogFilters/);
  });

  it('DISC-03-08: W94/W95 guest preview copy via GuestWire outside explore tree', () => {
    const directGuestCopy = /from ['"][^'"]*guestMapPreviewCopy['"]/;
    const roots = ['src/list', 'src/content', 'src/pages', 'src/components'];
    const violations: string[] = [];
    const walk = (dir: string) => {
      if (!existsSync(join(process.cwd(), dir))) return;
      for (const ent of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === 'node_modules') continue;
          walk(full);
        } else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) {
          const rel = full.replace(/\\/g, '/');
          if (directGuestCopy.test(read(rel))) violations.push(rel);
        }
      }
    };
    for (const root of roots) walk(root);
    expect(violations).toEqual([]);
    expect(read('src/content/guestBrowseGateCopy.ts')).toMatch(/discoveryPortExploreGuestWire/);
    expect(read('src/list/browse/browseListCopy.ts')).toMatch(/discoveryPortExploreGuestWire/);
    expect(read('src/explore/exploreBrowseTaxonomy.ts')).not.toMatch(/EXPLORE_SEARCH_GUEST_PLACEHOLDER/);
  });

  it('DISC-03-09: W77 list direct explore/ui import allowlist (join overlays only)', () => {
    const directExploreUi = /from ['"][^'"]*explore\/ui\//;
    const allow = new Set(['src/list/browse/ListFeedActionsProvider.tsx']);
    const violations: string[] = [];
    const walk = (dir: string) => {
      for (const ent of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === 'node_modules') continue;
          walk(full);
        } else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) {
          const rel = full.replace(/\\/g, '/');
          if (allow.has(rel)) continue;
          if (directExploreUi.test(read(rel))) violations.push(rel);
        }
      }
    };
    walk('src/list');
    expect(violations).toEqual([]);
    expect(read('src/list/browse/ListFeedActionsProvider.tsx')).toMatch(
      /explore\/ui\/ExploreJoinOverlays/
    );
    expect(read('src/list/explorer/ListDiscoverySearchField.tsx')).toMatch(/discoveryPortExploreGuestWire/);
  });

  it('W20 config prod routes explore via discoveryPortExplore facades (incl routingCatalog)', () => {
    const allow = new Set(['src/config/routingCatalogLite.ts']);
    const directExplore = /from ['"][^'"]*explore\//;
    const violations: string[] = [];
    for (const ent of readdirSync(join(process.cwd(), 'src/config'), { withFileTypes: true })) {
      if (!ent.isFile() || !/\.(ts|tsx)$/.test(ent.name) || ent.name.endsWith('.test.ts')) continue;
      const rel = `src/config/${ent.name}`;
      if (allow.has(rel)) continue;
      if (directExplore.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
  });

  it('W18 geo prod routes explore UI/routing via discoveryPortExplore facades', () => {
    const directExplore = /from ['"][^'"]*explore\//;
    const violations: string[] = [];
    const walkGeo = (dir: string) => {
      for (const ent of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === 'node_modules') continue;
          walkGeo(full);
        } else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) {
          const rel = relative(process.cwd(), full).replace(/\\/g, '/');
          if (directExplore.test(read(rel))) violations.push(rel);
        }
      }
    };
    walkGeo('src/geo');
    expect(violations).toEqual([]);
  });

  it('W22–W23 activity/place + content + my-crew social prod route explore via discoveryPortExplore facades', () => {
    const directExplore = /from ['"][^'"]*explore\//;
    const roots = ['src/activity', 'src/place', 'src/content', 'src/components/social'];
    const violations: string[] = [];
    const walk = (dir: string) => {
      for (const ent of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === 'node_modules') continue;
          walk(full);
        } else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) {
          const rel = relative(process.cwd(), full).replace(/\\/g, '/');
          if (directExplore.test(read(rel))) violations.push(rel);
        }
      }
    };
    for (const root of roots) walk(root);
    expect(violations).toEqual([]);
  });

  it('W35 plan, utils, member, hosting, discovery engagement via ports', () => {
    const directExplore = /from ['"][^'"]*explore\//;
    const roots = ['src/plan', 'src/member', 'src/hosting'];
    const violations: string[] = [];
    const walk = (dir: string) => {
      for (const ent of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) {
          const rel = relative(process.cwd(), full).replace(/\\/g, '/');
          if (directExplore.test(read(rel))) violations.push(rel);
        }
      }
    };
    for (const root of roots) walk(root);
    const utilsTargets = ['src/utils/authSessionLanding.ts', 'src/utils/mobileBackNav.ts'];
    for (const rel of utilsTargets) {
      if (directExplore.test(read(rel))) violations.push(rel);
    }
    const discoveryTargets = [
      'src/discovery/discoveryOfferRideshareDispatch.ts',
      'src/discovery/discoveryCardViewModel.ts',
      'src/discovery/ActivityDiscoveryPublishedBody.tsx',
    ];
    for (const rel of discoveryTargets) {
      if (directExplore.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
  });

  it('W34 activity-discovery and places-discovery catalogs via discoveryPortExplore', () => {
    const directExplore = /from ['"][^'"]*explore\//;
    const roots = ['src/activity-discovery', 'src/places-discovery'];
    const violations: string[] = [];
    const walk = (dir: string) => {
      for (const ent of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) {
          const rel = relative(process.cwd(), full).replace(/\\/g, '/');
          if (directExplore.test(read(rel))) violations.push(rel);
        }
      }
    };
    for (const root of roots) walk(root);
    expect(violations).toEqual([]);
  });

  it('W33 discoveryCardModel, services, routing import explore only via ports or shared-types', () => {
    const directExplore = /from ['"][^'"]*explore\//;
    const targets = [
      'src/discovery/discoveryCardModel.ts',
      'src/services/hostingActivityPublish.ts',
      'src/services/catalogPlaceSubmit.ts',
      'src/services/catalogFacilitySubmit.ts',
      'src/routing/AppRoutes.tsx',
      'src/routing/planBrowseRoute.tsx',
    ];
    const violations = targets.filter((rel) => directExplore.test(read(rel)));
    expect(violations).toEqual([]);
  });

  it('W32 src/hooks (non-explore) imports explore only via discoveryPortExplore', () => {
    const directExplore = /from ['"][^'"]*explore\//;
    const violations: string[] = [];
    for (const ent of readdirSync(join(process.cwd(), 'src/hooks'), { withFileTypes: true })) {
      if (!ent.isFile() || !/\.(ts|tsx)$/.test(ent.name) || ent.name.endsWith('.test.ts')) continue;
      const rel = `src/hooks/${ent.name}`.replace(/\\/g, '/');
      if (directExplore.test(read(rel))) violations.push(rel);
    }
    expect(violations).toEqual([]);
  });

  it('W31 src/create bounded context imports explore only via discoveryPortExplore', () => {
    const directExplore = /from ['"][^'"]*explore\//;
    const violations: string[] = [];
    const walk = (dir: string) => {
      for (const ent of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) {
          const rel = relative(process.cwd(), full).replace(/\\/g, '/');
          if (directExplore.test(read(rel))) violations.push(rel);
        }
      }
    };
    walk('src/create');
    expect(violations).toEqual([]);
  });

  it('W30 shop, org console, place guest, facility detail, select hooks via discoveryPortExplore', () => {
    const directExplore = /from ['"][^'"]*explore\//;
    const filePaths = [
      'src/components/shop/ShopPublicPage.tsx',
      'src/components/organisation-console/ProProfileApplicationFlow.tsx',
      'src/components/place/detail/PlaceDetailGuestGate.tsx',
      'src/facility/detail/templates/FacilityDetailSections.tsx',
      'src/hooks/useHostActivityManageActions.ts',
      'src/hooks/useMobileBottomNav.ts',
    ];
    const violations = filePaths.filter((rel) => directExplore.test(read(rel)));
    expect(violations).toEqual([]);
  });

  it('W28 components/ui map + publishing/admin host navigate via ports or shared-types', () => {
    const directExplore = /from ['"][^'"]*explore\//;
    const uiTargets = [
      'src/components/ui/PlacesMap.tsx',
      'src/components/ui/MeetingPointMap.tsx',
      'src/components/ui/PlaceCardActions.tsx',
      'src/components/ui/JoinRequestModal.tsx',
    ];
    const violations: string[] = [];
    for (const rel of uiTargets) {
      if (directExplore.test(read(rel))) violations.push(rel);
    }
    const walk = (dir: string) => {
      for (const ent of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) {
          const rel = relative(process.cwd(), full).replace(/\\/g, '/');
          if (directExplore.test(read(rel))) violations.push(rel);
        }
      }
    };
    walk('src/pages/publishing');
    walk(join('src/pages/admin'));
    expect(violations).toEqual([]);
  });

  it('W27 destination, detail shared, consumer pages prod route explore via discoveryPortExplore facades', () => {
    const directExplore = /from ['"][^'"]*explore\//;
    const roots = ['src/components/destination', 'src/detail/shared'];
    const violations: string[] = [];
    const walk = (dir: string) => {
      for (const ent of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === 'node_modules') continue;
          walk(full);
        } else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) {
          const rel = relative(process.cwd(), full).replace(/\\/g, '/');
          if (directExplore.test(read(rel))) violations.push(rel);
        }
      }
    };
    for (const root of roots) walk(root);
    const walkPages = (dir: string) => {
      for (const ent of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === 'admin' || ent.name === 'publishing' || ent.name === 'node_modules') continue;
          walkPages(full);
        } else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) {
          const rel = relative(process.cwd(), full).replace(/\\/g, '/');
          if (directExplore.test(read(rel))) violations.push(rel);
        }
      }
    };
    walkPages('src/pages');
    expect(violations).toEqual([]);
  });

  it('W26 availability + mobile + layout prod route explore via discoveryPortExplore facades', () => {
    const directExplore = /from ['"][^'"]*explore\//;
    const roots = ['src/availability', 'src/components/mobile', 'src/components/layout'];
    const violations: string[] = [];
    const walk = (dir: string) => {
      for (const ent of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === 'node_modules') continue;
          walk(full);
        } else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) {
          const rel = relative(process.cwd(), full).replace(/\\/g, '/');
          if (directExplore.test(read(rel))) violations.push(rel);
        }
      }
    };
    for (const root of roots) walk(root);
    expect(violations).toEqual([]);
  });

  it('W25 plan + auth prod route explore via discoveryPortExplore facades', () => {
    const directExplore = /from ['"][^'"]*explore\//;
    const roots = ['src/components/plan', 'src/components/auth'];
    const violations: string[] = [];
    const walk = (dir: string) => {
      for (const ent of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === 'node_modules') continue;
          walk(full);
        } else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) {
          const rel = relative(process.cwd(), full).replace(/\\/g, '/');
          if (directExplore.test(read(rel))) violations.push(rel);
        }
      }
    };
    for (const root of roots) walk(root);
    expect(violations).toEqual([]);
  });

  it('W24 components/activity prod routes explore via discoveryPortExplore facades', () => {
    const directExplore = /from ['"][^'"]*explore\//;
    const violations: string[] = [];
    const walk = (dir: string) => {
      for (const ent of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === 'node_modules') continue;
          walk(full);
        } else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) {
          const rel = relative(process.cwd(), full).replace(/\\/g, '/');
          if (directExplore.test(read(rel))) violations.push(rel);
        }
      }
    };
    walk('src/components/activity');
    expect(violations).toEqual([]);
  });

  it('W21 crew-discovery prod routes explore via discoveryPortExplore facades', () => {
    const directExplore = /from ['"][^'"]*explore\//;
    const violations: string[] = [];
    const walkCrew = (dir: string) => {
      for (const ent of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === 'node_modules') continue;
          walkCrew(full);
        } else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) {
          const rel = relative(process.cwd(), full).replace(/\\/g, '/');
          if (directExplore.test(read(rel))) violations.push(rel);
        }
      }
    };
    walkCrew('src/crew-discovery');
    expect(violations).toEqual([]);
  });

  it('W16–W17 cross-context surfaces route list browse via discoveryPortList facades', () => {
    const allowDirect = /list\//;
    const roots = [
      'src/activity',
      'src/place',
      'src/components/chat',
      'src/components/auth',
      'src/components/activity',
      'src/content',
      'src/my-crew',
      'src/geo',
      'src/crew-discovery',
    ];
    const violations: string[] = [];
    const walk = (dir: string) => {
      for (const ent of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const full = join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === 'node_modules') continue;
          walk(full);
        } else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) {
          const rel = relative(process.cwd(), full).replace(/\\/g, '/');
          if (allowDirect.test(read(rel))) violations.push(rel);
        }
      }
    };
    for (const root of roots) walk(root);
    expect(violations).toEqual([]);
  });

  it('DISC-03-05: verify:discovery-graph wired', () => {
    expect(read('package.json')).toMatch(/verify:discovery-graph/);
    expect(existsSync(join(process.cwd(), 'scripts/verify/verify-discovery-graph.mjs'))).toBe(true);
  });
});