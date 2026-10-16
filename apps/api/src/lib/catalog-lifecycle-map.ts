import type { CatalogModerationStatus, CatalogPublicationStatus } from '@uaetrail/shared-types';
import { LocationStatus } from '../domain/enums.js';

/** Map legacy `locations` status + registry flag to CPC catalog lifecycle fields. */
export const catalogLifecycleFromLocationRow = (row: {
  status: string;
  registryListed?: boolean | null;
}): {
  moderationStatus: CatalogModerationStatus;
  publicationStatus: CatalogPublicationStatus;
} => {
  const status = String(row.status).toUpperCase();

  let moderationStatus: CatalogModerationStatus = 'approved';
  if (status === LocationStatus.DRAFT) moderationStatus = 'pending';
  if (status === LocationStatus.INACTIVE) moderationStatus = 'suspended';

  let publicationStatus: CatalogPublicationStatus = 'listed';
  if (row.registryListed === false) {
    publicationStatus = 'anchor_only';
  } else if (status === LocationStatus.DRAFT || status === LocationStatus.INACTIVE) {
    publicationStatus = 'unlisted';
  }

  return { moderationStatus, publicationStatus };
};

/** Stamp CPC lifecycle fields on a place/facility row before persist (dual-write transition). */
export const withCatalogLifecycleFields = <
  T extends {
    status: string;
    registryListed?: boolean | null;
    submittedById?: string | null;
    registeredByUserId?: string | null;
  },
>(
  row: T
): T & ReturnType<typeof catalogLifecycleFromLocationRow> & { registeredByUserId: string | null } => {
  const lifecycle = catalogLifecycleFromLocationRow(row);
  const registeredByUserId = row.registeredByUserId ?? row.submittedById ?? null;
  return { ...row, ...lifecycle, registeredByUserId };
};
