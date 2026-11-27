import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readAppRouteRegistry } from '../../scripts/dev/readAppRouteRegistry.mjs';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

/**
 * Maps consumer-detail-surfaces plan §8 entity-detail rows to route modules + guard tests.
 * Full §8 UX checks remain manual; this guard prevents route/shell drift without a QA sign-off.
 */
const ENTITY_DETAIL_QA_MATRIX: Array<{
  surface: string;
  routePattern: RegExp;
  pageOrView: string;
  automatedGuard: string;
}> = [
  {
    surface: 'Activity',
    routePattern: /path="\/activity\/:id"/,
    pageOrView: 'src/pages/ActivityDetail.tsx',
    automatedGuard: 'activityDetailAcceptance.test.ts',
  },
  {
    surface: 'Activity (seeking)',
    routePattern: /path="\/activity\/:id"/,
    pageOrView: 'src/pages/ActivityDetail.tsx',
    automatedGuard: 'activityDetailAcceptance.test.ts',
  },
  {
    surface: 'Place (canonical)',
    routePattern: /path="\/place\/:id"/,
    pageOrView: 'src/pages/PlaceDetailPage.tsx',
    automatedGuard: 'placeDetailCore.test.ts',
  },
  {
    surface: 'Facility',
    routePattern: /path="\/facility\/:id"/,
    pageOrView: 'src/pages/FacilityDetailPage.tsx',
    automatedGuard: 'placeDetailCore.test.ts',
  },
  {
    surface: 'Destination hub',
    routePattern: /path="\/destination\/:slug"/,
    pageOrView: 'src/pages/DestinationDetailPage.tsx',
    automatedGuard: 'destinationDetailAcceptance.test.ts',
  },
  {
    surface: 'Shop',
    routePattern: /path="\/shop\/:id"/,
    pageOrView: 'src/pages/ShopPublic.tsx',
    automatedGuard: 'publicEntityShellAcceptance.test.ts',
  },
  {
    surface: 'Agency/partner',
    routePattern: /path="\/agency\/:id"|path="\/partner\/:id"/,
    pageOrView: 'src/pages/OrganisationProfile.tsx',
    automatedGuard: 'publicEntityShellAcceptance.test.ts',
  },
  {
    surface: 'Member',
    routePattern: /path="\/member\/:userId"/,
    pageOrView: 'src/pages/MemberProfile.tsx',
    automatedGuard: 'detailSurfaceDataLineageGuard.test.ts',
  },
];

describe('consumerDetailQaMatrixGuard (plan §8 entity detail)', () => {
  it('App.tsx registers §8 entity detail routes', () => {
    const app = readAppRouteRegistry();
    const missing: string[] = [];
    for (const { surface, routePattern } of ENTITY_DETAIL_QA_MATRIX) {
      if (!routePattern.test(app)) {
        missing.push(surface);
      }
    }
    expect(missing).toEqual([]);
  });

  it('entity detail modules exist for §8 matrix', () => {
    const missing: string[] = [];
    for (const { surface, pageOrView } of ENTITY_DETAIL_QA_MATRIX) {
      try {
        read(pageOrView);
      } catch {
        missing.push(`${surface}: ${pageOrView}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('automated guard tests referenced in §8.1 are in verify:domain bundle', () => {
    const verifyScript = [
      read('scripts/verify/verify-domain-canonicals.mjs'),
      read('scripts/verify/verify-domain-fe.mjs'),
      read('scripts/verify/domain-fe-vitest-files.mjs'),
      read('scripts/verify/verify-domain-api.mjs'),
    ].join('\n');
    const missing: string[] = [];
    for (const { surface, automatedGuard } of ENTITY_DETAIL_QA_MATRIX) {
      if (!verifyScript.includes(automatedGuard)) {
        missing.push(`${surface}: ${automatedGuard}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
