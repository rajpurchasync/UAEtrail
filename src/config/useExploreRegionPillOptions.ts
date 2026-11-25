import { useMemo } from 'react';
import type { CountryCode } from './regions';
import { DEFAULT_COUNTRY, mergeExploreRegionPillOptionsWithAreas } from './regions';
import { useExplorePublishedDestinations } from '../explore/useExplorePublishedDestinations';

/** Explore emirate scope pills — static catalog + published area regions. */
export const useExploreRegionPillOptions = (code: CountryCode = DEFAULT_COUNTRY) => {
  const areas = useExplorePublishedDestinations();
  return useMemo(() => mergeExploreRegionPillOptionsWithAreas(areas, code), [areas, code]);
};