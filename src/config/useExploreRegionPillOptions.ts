import { useMemo } from 'react';
import type { CountryCode } from './regions';
import { DEFAULT_COUNTRY, mergeExploreRegionPillOptionsWithAreas } from './regions';
import { useExplorePublishedAreas } from '../explore/useExplorePublishedAreas';

/** Explore emirate scope pills — static catalog + published area regions. */
export const useExploreRegionPillOptions = (code: CountryCode = DEFAULT_COUNTRY) => {
  const areas = useExplorePublishedAreas();
  return useMemo(() => mergeExploreRegionPillOptionsWithAreas(areas, code), [areas, code]);
};