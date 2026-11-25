/** Pro guide/agency storefronts tied to an area via **hosted outings** — not map pins. */
import { resolveActivityPublisherProfilePath } from '@uaetrail/shared-types';
import { TenantBusinessMode } from '../domain/enums.js';
import { listPublishedUpcomingActivitiesByDestination } from './activities-store.js';
import { findTenantsByIds } from './tenant-store.js';

export type AreaProHostPreview = {
  id: string;
  name: string;
  slug: string;
  profileKind: 'agency' | 'pro_guide';
  path: string;
};

const ACTIVITY_SCAN = 40;

export const listProHostStorefrontsForAreaPreview = async (
  destinationId: string,
  limit = 8
): Promise<AreaProHostPreview[]> => {
  const events = await listPublishedUpcomingActivitiesByDestination(destinationId, ACTIVITY_SCAN);
  const tenantIdsInOrder: string[] = [];
  const seen = new Set<string>();

  for (const event of events) {
    const tenantId = event.tenant.id;
    if (seen.has(tenantId)) continue;
    seen.add(tenantId);
    tenantIdsInOrder.push(tenantId);
  }

  const tenantsById = await findTenantsByIds(tenantIdsInOrder);
  const rows: AreaProHostPreview[] = [];

  for (const tenantId of tenantIdsInOrder) {
    const tenant = tenantsById.get(tenantId);
    if (!tenant || tenant.businessMode === TenantBusinessMode.SHOP) continue;
    const profileKind =
      tenant.businessMode === TenantBusinessMode.AGENCY ? 'agency' : 'pro_guide';
    rows.push({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      profileKind,
      path:
        resolveActivityPublisherProfilePath({
          publishingProfileKind: profileKind,
          tenantSlug: tenant.slug,
          hostUserId: tenant.ownerId,
        }) ?? `/member/${tenant.ownerId}`,
    });
    if (rows.length >= limit) break;
  }

  return rows;
};
