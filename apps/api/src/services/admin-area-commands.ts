import { ApiError } from '../lib/api-error.js';
import { boundsRingFromCenter } from '../lib/area-bounds.js';
import { invalidatePublishedDestinationsCache } from '../lib/destination-resolution.js';
import {
  createAdminArea,
  deleteAdminArea,
  updateAdminArea,
} from '../lib/areas-store.js';
import { scheduleExploreMapCacheInvalidation } from '../lib/explore-map-cache-schedule.js';

type AreaCenter = { latitude: number; longitude: number };
type AreaBoundsPoint = AreaCenter;

export type AdminAreaWriteInput = {
  slug: string;
  name: string;
  region: string;
  status: 'draft' | 'published';
  center: AreaCenter;
  bounds?: AreaBoundsPoint[];
  priority?: number;
  summary?: string | null;
  countryCode?: string;
  imageUrl?: string | null;
};

const invalidateAreaDiscoveryCaches = () => {
  invalidatePublishedDestinationsCache();
  scheduleExploreMapCacheInvalidation('admin.area_map_cache');
};

export const createAdminAreaRecord = async (body: AdminAreaWriteInput) => {
  const bounds = body.bounds ?? boundsRingFromCenter(body.center);
  const created = await createAdminArea({ ...body, bounds });
  invalidateAreaDiscoveryCaches();
  return created;
};

export const updateAdminAreaRecord = async (id: string, body: Partial<AdminAreaWriteInput>) => {
  const patch =
    body.center && !body.bounds ? { ...body, bounds: boundsRingFromCenter(body.center) } : body;
  const updated = await updateAdminArea(id, patch);
  if (!updated) {
    throw new ApiError(404, 'area_not_found', 'Area not found.');
  }
  invalidateAreaDiscoveryCaches();
  return updated;
};

export const deleteAdminAreaRecord = async (id: string) => {
  const deleted = await deleteAdminArea(id);
  if (!deleted) {
    throw new ApiError(404, 'area_not_found', 'Area not found.');
  }
  invalidateAreaDiscoveryCaches();
};
