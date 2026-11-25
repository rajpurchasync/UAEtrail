import { ApiError } from '../lib/api-error.js';
import { boundsRingFromCenter } from '../lib/destination-bounds.js';
import { invalidatePublishedDestinationsCache } from '../lib/destination-resolution.js';
import {
  createAdminDestination,
  deleteAdminDestination,
  updateAdminDestination,
} from '../lib/destinations-store.js';
import { scheduleExploreMapCacheInvalidation } from '../lib/explore-map-cache-schedule.js';

type DestinationCenter = { latitude: number; longitude: number };
type DestinationBoundsPoint = DestinationCenter;

export type AdminDestinationWriteInput = {
  slug: string;
  name: string;
  region: string;
  status: 'draft' | 'published';
  center: DestinationCenter;
  bounds?: DestinationBoundsPoint[];
  priority?: number;
  summary?: string | null;
  countryCode?: string;
  imageUrl?: string | null;
};

const invalidateDestinationDiscoveryCaches = () => {
  invalidatePublishedDestinationsCache();
  scheduleExploreMapCacheInvalidation('admin.destination_map_cache');
};

export const createAdminDestinationRecord = async (body: AdminDestinationWriteInput) => {
  const bounds = body.bounds ?? boundsRingFromCenter(body.center);
  const created = await createAdminDestination({ ...body, bounds });
  invalidateDestinationDiscoveryCaches();
  return created;
};

export const updateAdminDestinationRecord = async (
  id: string,
  body: Partial<AdminDestinationWriteInput>
) => {
  const patch =
    body.center && !body.bounds ? { ...body, bounds: boundsRingFromCenter(body.center) } : body;
  const updated = await updateAdminDestination(id, patch);
  if (!updated) {
    throw new ApiError(404, 'destination_not_found', 'Destination not found.');
  }
  invalidateDestinationDiscoveryCaches();
  return updated;
};

export const deleteAdminDestinationRecord = async (id: string) => {
  const deleted = await deleteAdminDestination(id);
  if (!deleted) {
    throw new ApiError(404, 'destination_not_found', 'Destination not found.');
  }
  invalidateDestinationDiscoveryCaches();
};