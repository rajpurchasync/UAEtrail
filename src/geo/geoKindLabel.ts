import type { GeoKind } from '@uaetrail/shared-types';

export const geoKindLabel = (kind: GeoKind): string => {
  if (kind === 'country') return 'Country';
  if (kind === 'state') return 'Emirate';
  if (kind === 'area') return 'Area';
  return 'Venue';
};
