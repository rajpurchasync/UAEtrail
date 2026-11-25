import { useMemo } from 'react';
import type { CountryCode } from './regions';
import { DEFAULT_COUNTRY, mergeVenueStateFilterOptionsWithAreas } from './regions';
import { useExplorePublishedDestinations } from '../explore/useExplorePublishedDestinations';

/** Venue / emirate filter pills backed by static UAE list + `GET /areas` regions. */
export const useVenueStateFilterOptions = (code: CountryCode = DEFAULT_COUNTRY) => {
  const areas = useExplorePublishedDestinations();
  return useMemo(() => mergeVenueStateFilterOptionsWithAreas(areas, code), [areas, code]);
};