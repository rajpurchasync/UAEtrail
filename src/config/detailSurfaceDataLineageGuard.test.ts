import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

/**
 * Consumer entity detail pages must load through hook facades (R8) wired to the
 * correct bounded context — see DOMAIN_CANONICALS §3.2 and consumer-detail-surfaces §18.
 */
const DETAIL_SURFACE_LINEAGE: Array<{ page: string; facadePattern: RegExp }> = [
  { page: 'src/pages/ActivityDetail.tsx', facadePattern: /usePublicActivityDetail/ },
  { page: 'src/pages/PlaceDetailPage.tsx', facadePattern: /usePlaceDetailCore/ },
  { page: 'src/pages/DestinationDetailPage.tsx', facadePattern: /destinationHubClientApi/ },
  { page: 'src/pages/ShopPublic.tsx', facadePattern: /shopPublicClientApi/ },
  { page: 'src/pages/OrganisationProfile.tsx', facadePattern: /organisationConsoleApi/ },
  { page: 'src/pages/MemberProfile.tsx', facadePattern: /memberPublicProfileApi/ },
];

describe('detailSurfaceDataLineageGuard', () => {
  it('entity detail route modules use documented client facades', () => {
    const violations: string[] = [];
    for (const { page, facadePattern } of DETAIL_SURFACE_LINEAGE) {
      const source = read(page);
      if (!facadePattern.test(source)) {
        violations.push(`${page}: missing facade ${facadePattern}`);
      }
      if (/\bapi\.(get|post|patch|delete)/.test(source)) {
        violations.push(`${page}: do not call api.* directly — use hooks/*ClientApi`);
      }
    }
    expect(violations).toEqual([]);
  });
});
