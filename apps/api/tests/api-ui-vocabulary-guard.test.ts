import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const API_SRC = join(process.cwd(), 'src');

/**
 * Discovery read-model files may reference map/list projection and L2 engagement wire.
 * Everything else on the API should speak in entities, catalogs, and viewerAccess — not SPA layout.
 */
const DISCOVERY_READ_MODEL_PREFIXES = [
  'lib/explore-map',
  'lib/explore-display',
  'lib/explore-geo',
  'lib/explore-activity-date',
  'lib/explore-seeking',
  'lib/explore-map-cache',
  'lib/explore-map-bbox',
  'lib/explore-map-list-projection',
  'lib/explore-person',
  'lib/member-routes',
  'services/explore-map-overlay-read',
  'services/member-discovery',
  'services/member-entitlements',
  'services/activity-viewer-access',
  'services/compose-activity-viewer-access',
  'routes/user/registerPublicPlaceRoutes',
  'routes/user/registerMeDiscoverOverlayRoutes',
  'routes/user/registerMemberDiscoveryRoutes',
  'routes/user/registerExploreAvailabilityRoutes',
] as const;

const UI_SURFACE_TOKENS =
  /\b(listExplorer|ListDiscovery|ListExplorer|embedMode|fiveTab|thumbnailLayout|MapPeekShell|ListingCard)\b/;

const collectTsFiles = (dir: string): string[] => {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectTsFiles(full));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      out.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return out;
};

const isDiscoveryReadModel = (relPath: string): boolean =>
  DISCOVERY_READ_MODEL_PREFIXES.some(
    (prefix) =>
      relPath === `src/${prefix}` ||
      relPath.startsWith(`src/${prefix}`) ||
      relPath.endsWith(`/${prefix}.ts`) ||
      relPath.includes(`/${prefix}`)
  );

describe('api-ui-vocabulary-guard', () => {
  it('API-UI-01: core domain layer does not import SPA layout vocabulary', () => {
    const domainDir = join(API_SRC, 'domain');
    const violations: string[] = [];
    for (const file of collectTsFiles(domainDir)) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (UI_SURFACE_TOKENS.test(content)) {
        violations.push(file);
      }
    }
    expect(violations).toEqual([]);
  });

  it('API-UI-02: services/lib outside discovery read-model avoid ListExplorer / layout tokens', () => {
    const roots = [join(API_SRC, 'lib'), join(API_SRC, 'services')] as const;
    const violations: string[] = [];
    for (const root of roots) {
      for (const file of collectTsFiles(root)) {
        if (isDiscoveryReadModel(file)) continue;
        const content = readFileSync(join(process.cwd(), file), 'utf8');
        if (UI_SURFACE_TOKENS.test(content)) {
          violations.push(file);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('API-UI-03: no /list HTTP catalog — list layout is a client projection of GET /explore/map', () => {
    const routesDir = join(API_SRC, 'routes');
    const violations: string[] = [];
    for (const file of collectTsFiles(routesDir)) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/\.(get|post|put|patch|delete)\(\s*['"`]\/list/.test(content)) {
        violations.push(`${file}: list surface is FE-only`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('API-UI-05: detail presentation builder stays on activity public read (not catalog lib)', () => {
    const catalogLibs = [
      'src/lib/discovery-catalog-builder.ts',
      'src/lib/explore-map-route.ts',
      'src/lib/explore-map-viewer-access.ts',
    ];
    for (const rel of catalogLibs) {
      const content = readFileSync(join(process.cwd(), rel), 'utf8');
      expect(content).not.toMatch(/buildActivityPresentationForDetail/);
    }
    const detail = readFileSync(join(process.cwd(), 'src/services/activity-public-read.ts'), 'utf8');
    expect(detail).toMatch(/buildActivityPresentationForDetail/);
  });

  it('API-UI-04: catalogue read stays on explore/map + projection query (not a second product API)', () => {
    const route = readFileSync(join(API_SRC, 'lib/explore-map-route.ts'), 'utf8');
    expect(route).toMatch(/applyExploreMapHttpProjection/);
    expect(route).toMatch(/buildExploreMapPayload/);
    const projection = readFileSync(join(API_SRC, 'lib/explore-map-list-projection.ts'), 'utf8');
    expect(projection).toMatch(/projection/);
    expect(projection).not.toMatch(/listExplorer/);
  });
});