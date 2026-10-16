import type { CatalogModerationStatus, CatalogPublicationStatus } from './catalog-lifecycle.js';
import type { FacilityKind } from './facility-kind.js';

/** Amenity POI — `facilities` collection (Program CPC). */
export interface FacilityDTO {
  id: string;
  name: string;
  region: string;
  areaLabel?: string | null;
  areaId: string;
  facilityKind: FacilityKind;
  /** When set, amenity is scoped to a parent Place (trail rest stop, trailhead toilet, …). */
  parentPlaceId?: string | null;
  description?: string;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  tags?: string[];
  status?: string;
  moderationStatus?: CatalogModerationStatus;
  publicationStatus?: CatalogPublicationStatus;
  /** Who registered this row on the catalog (member or admin actor). */
  registeredByUserId?: string | null;
  /** @deprecated Use {@link registeredByUserId}. */
  submittedById?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
