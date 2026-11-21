import { useMemo } from 'react';
import type { CountryCode } from './regions';
import { DEFAULT_COUNTRY, mergeVenueStateFilterOptionsWithAreas } from './regions';
import { useExplorePublishedAreas } from '../explore/useExplorePublishedAreas';

/** Venue / emirate filter pills backed by static UAE list + `GET /areas` regions. */
export const useVenueStateFilterOptions = (code: CountryCode = DEFAULT_COUNTRY) => {
  const areas = useExplorePublishedAreas();
  return useMemo(() => mergeVenueStateFilterOptionsWithAreas(areas, code), [areas, code]);
};