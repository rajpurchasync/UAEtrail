import type { AvailabilityKind } from '@uaetrail/shared-types';

/** Query params for `GET /discover/recommendations?surface=crew`. */
export type DiscoverCrewRecommendationsQueryParams = {
  from: string;
  to: string;
  date: string | null;
  area: string | null;
  kind: AvailabilityKind | null;
  limit?: number;
};