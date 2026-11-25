/** Curated outdoor **Destination** store (Mongo collection `areas`). */
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