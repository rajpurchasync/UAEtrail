/**
 * Curated outdoor **Destination** store (MIG-DESTINATION-GEO-2026).
 * Physical Mongo collection is still `areas` until optional rename (P3+).
 */
import type { AreaDTO, AreaPublicDTO, AreaStatus, DestinationPublicDTO } from '@uaetrail/shared-types';

export {
  listPublishedAreas as listPublishedDestinations,
  listAdminAreas as listAdminDestinations,
  findAreaBySlug as findDestinationBySlug,
  findAreaById as findDestinationById,
  findPublishedAreaById as findPublishedDestinationById,
  createAdminArea as createAdminDestination,
  updateAdminArea as updateAdminDestination,
  deleteAdminArea as deleteAdminDestination,
} from './areas-store.js';

import { toAreaPublicDto } from './areas-store.js';

export const toDestinationPublicDto = (row: AreaDTO | AreaPublicDTO): DestinationPublicDTO =>
  'status' in row ? toAreaPublicDto(row) : row;

export type { AreaStatus as DestinationStatus };