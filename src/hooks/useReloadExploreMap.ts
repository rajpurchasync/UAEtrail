import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { reloadExploreMap } from './useExploreMap';

/** Refresh explore map data after host/admin publish or activity changes. */
export const useReloadExploreMap = () => {
  const queryClient = useQueryClient();
  return useCallback(() => reloadExploreMap(queryClient), [queryClient]);
};
