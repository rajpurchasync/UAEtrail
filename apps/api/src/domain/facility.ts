/**
 * Facility amenity row — `facilities` collection (Program CPC).
 * @see docs/SYSTEM_COHERENCE.md §8.4
 */

import type { CatalogModerationStatus, CatalogPublicationStatus, FacilityKind } from '@uaetrail/shared-types';
import type { LocationStatus } from './enums.js';

export interface Facility {
  id: string;
  name: string;
  region: string;
  areaLabel: string | null;
  areaId: string;
  facilityKind: FacilityKind;
  parentPlaceId?: string | null;
  description: string;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  tags: string[];
  status: LocationStatus;
  moderationStatus: CatalogModerationStatus;
  publicationStatus: CatalogPublicationStatus;
  registeredByUserId: string | null;
  /** @deprecated Dual-read during CPC migration. */
  submittedById?: string | null;
  countryCode: string;
  featured: boolean;
  registryListed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
