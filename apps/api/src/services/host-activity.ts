import { LocationStatus } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { findAdminLocationByIdForEventCreate } from '../lib/admin-store.js';
import { findLocationById, findTenantMembershipByUser } from '../lib/activities-store.js';
import type { Location } from '../domain/types.js';

export const resolveActivityLocation = async (
  locationId: string,
  userId: string,
  opts: { platformAdmin: boolean }
): Promise<Location> => {
  if (opts.platformAdmin) {
    const location = await findAdminLocationByIdForEventCreate(locationId);
    if (!location) {
      throw new ApiError(404, 'location_not_found', 'Location not found.');
    }
    return location;
  }

  const location = await findLocationById(locationId);
  if (!location) {
    throw new ApiError(400, 'invalid_location', 'Location not found.');
  }

  const ownDraft =
    location.status === LocationStatus.DRAFT && location.submittedById === userId;
  if (location.status !== LocationStatus.ACTIVE && !ownDraft) {
    throw new ApiError(
      400,
      'invalid_location',
      'Location must be active, or a draft you submitted while it is under review.'
    );
  }

  return location;
};

export const assertActivityHost = async (
  tenantId: string,
  hostId: string,
  tenant: { ownerId: string },
  opts: { platformAdmin: boolean }
): Promise<void> => {
  if (opts.platformAdmin) return;

  const hostMembership = await findTenantMembershipByUser(tenantId, hostId);
  if (!hostMembership && tenant.ownerId !== hostId) {
    throw new ApiError(400, 'invalid_host', 'Host must be a member of this organization.');
  }
};

export const assertActivityHostPatch = async (
  tenantId: string,
  hostId: string,
  opts: { platformAdmin: boolean }
): Promise<void> => {
  if (opts.platformAdmin) return;

  const hostMembership = await findTenantMembershipByUser(tenantId, hostId);
  if (!hostMembership) {
    throw new ApiError(400, 'invalid_host', 'Host must be a member of this organization.');
  }
};
