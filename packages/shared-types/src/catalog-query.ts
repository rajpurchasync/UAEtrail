import type { FacilityKind } from './facility-kind.js';
import type { PlaceKind } from './place-kind.js';

export type PlaceCatalogPurpose = 'organize_picker' | 'map' | 'admin_queue' | 'detail';

/** `place` = trail/camp/venue rows only (excludes facilities). */
export type PlaceCatalogSegment = 'place' | 'all';

export type PlaceCatalogQuery = {
  purpose?: PlaceCatalogPurpose;
  segment?: PlaceCatalogSegment;
  areaId?: string;
  placeKind?: PlaceKind;
  /** Legacy organize picker filter. */
  activityType?: 'hiking' | 'camping' | 'event';
  countryCode?: string;
};

export type FacilityCatalogQuery = {
  purpose?: PlaceCatalogPurpose;
  areaId?: string;
  parentPlaceId?: string | null;
  facilityKind?: FacilityKind;
  countryCode?: string;
};
