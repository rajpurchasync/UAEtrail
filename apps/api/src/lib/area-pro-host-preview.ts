/** Pro guide/agency storefronts tied to an area via **hosted outings** — not map pins. */
import { hostBrandProfilePath } from '@uaetrail/shared-types';
import { TenantBusinessMode } from '../domain/enums.js';
import { listPublishedUpcomingActivitiesByArea } from './activities-store.js';
import { findTenantById } from './tenant-store.js';

export type AreaProHostPreview = {
  id: string;
  name: string;
  slug: string;
  profileKind: 'agency' | 'pro_guide';
  path: string;
};

const ACTIVITY_SCAN = 40;

export const listProHostStorefrontsForAreaPreview = async (
  areaId: string,
  limit = 8
): Promise<AreaProHostPreview[]> => {
  const events = await listPublishedUpcomingActivitiesByArea(areaId, ACTIVITY_SCAN);
  const seen = new Set<string>();
  const rows: AreaProHostPreview[] = [];

  for (const event of events) {
    const tenantId = event.tenant.id;
    if (seen.has(tenantId)) continue;
    const tenant = await findTenantById(tenantId);
    if (!tenant || tenant.businessMode === TenantBusinessMode.SHOP) continue;
    seen.add(tenantId);
    const profileKind =
      tenant.businessMode === TenantBusinessMode.AGENCY ? 'agency' : 'pro_guide';
    rows.push({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      profileKind,
      path:
        hostBrandProfilePath(tenant.slug, profileKind) ??
        `/guide/${encodeURIComponent(tenant.slug)}`,
    });
    if (rows.length >= limit) break;
  }

  return rows;
};
