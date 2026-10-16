import {
  isFacilityPlaceKind,
  placeKindFromLocationRow,
} from '@uaetrail/shared-types';

export type AdminCatalogSegment = 'outdoor' | 'facility';

export const adminCatalogSegmentForRow = (row: {
  activityType: string;
  tags?: string[] | null;
}): AdminCatalogSegment => {
  const kind = placeKindFromLocationRow(row);
  return isFacilityPlaceKind(kind) ? 'facility' : 'outdoor';
};
