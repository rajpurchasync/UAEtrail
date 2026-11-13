import type { ActivityDTO } from './index.js';

export type PlaceReachableRideRowDTO = {
  activity: ActivityDTO;
  /** Great-circle km from ride destination to the place pin (null when coords missing). */
  distanceKmFromPlace: number | null;
};

export type PlaceReachableRidesResponse = {
  data: PlaceReachableRideRowDTO[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
};
