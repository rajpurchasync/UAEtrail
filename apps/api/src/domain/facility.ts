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
  destinationId: string | null;
  facilityKind: FacilityKind;
  onSiteId?: string | null;
  /** Geo-tree venue node id when the amenity is tagged to a venue. */
  venueId?: string | null;
  description: string;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  /** Optional partner / referral outbound URL (commercial facilities). */
  partnerReferralUrl?: string | null;
  tags: string[];
  status: LocationStatus;
  moderationStatus: CatalogModerationStatus;
  publicationStatus: CatalogPublicationStatus;
  registeredByUserId: string | null;
  /** @deprecated Dual-read during CPC migration. */
  submittedById?: string | null;
  countryCode: string;
  geoRef?: import('@uaetrail/shared-types').GeoRef | null;
  featured: boolean;
  registryListed?: boolean;
  amenityState?: import('@uaetrail/shared-types').AmenityState;
  amenityLastCheckedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}