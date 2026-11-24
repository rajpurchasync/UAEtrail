import type { AvailabilityKind } from '@uaetrail/shared-types';

/** Query params for `GET /discover/recommendations?surface=crew`. */
export type DiscoverCrewRecommendationsQueryParams = {
  from: string;
  to: string;
  date: string | null;
  /** Curated destination hub slug (explore `?destination=`) or emirate filter — not geo `GeoRef.areaId`. */
  destination: string | null;
  kind: AvailabilityKind | null;
  limit?: number;
};