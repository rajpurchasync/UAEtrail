import type { CatalogModerationStatus, CatalogPublicationStatus } from './catalog-lifecycle.js';
import type { FacilityKind } from './facility-kind.js';

export type AmenityState = 'working' | 'not_working' | 'unknown';

/** Pending curator review for a member condition report. */
export interface FacilityAmenityReportPendingReview {
  amenityState: AmenityState;
  submittedAt: string;
}

/** Amenity POI — `facilities` collection (Program CPC). */
export interface FacilityDTO {
  id: string;
  name: string;
  region: string;
  areaLabel?: string | null;
  /** Curated Destination (outdoor region). */
  destinationId?: string | null;
  /**
   * @deprecated Dual-read with {@link destinationId} until MIG-DESTINATION-GEO P9.
   */
  areaId: string;
  geoRef?: import('./geo-hierarchy.js').GeoRef | null;
  facilityKind: FacilityKind;
  /** Trail/site amenity scope — parent Place id (MIG-DESTINATION-GEO D0.5). */
  onSiteId?: string | null;
  /**
   * @deprecated Dual-read with {@link onSiteId} until facility site cutover.
   * When set, amenity is scoped to a parent Place (trail rest stop, trailhead toilet, …).
   */
  parentPlaceId?: string | null;
  /** Resolved parent place title — detail read enrichment when {@link onSiteId} is set. */
  parentPlaceName?: string | null;
  /** Optional geo-tree venue node id (not a catalog place id). */
  venueId?: string | null;
  description?: string;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  /** Optional partner / referral outbound URL (commercial facilities — plan §4.1). */
  partnerReferralUrl?: string | null;
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
  /** Working / dry / unknown — curator-confirmed (plan §4.1). */
  amenityState?: AmenityState;
  amenityLastCheckedAt?: string | null;
  /** Latest community condition report (may differ from curator-confirmed {@link amenityState}). */
  lastReportedAmenityState?: AmenityState | null;
  lastReportedAmenityAt?: string | null;
  /** When set, a report for this condition is already in the review queue. */
  pendingAmenityReview?: FacilityAmenityReportPendingReview | null;
}
