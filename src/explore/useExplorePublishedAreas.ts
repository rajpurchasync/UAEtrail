import { useState } from 'react';
import type { AreaPublicDTO } from '@uaetrail/shared-types';
import { fetchPublishedAreas } from '../hooks/areaHubClientApi';
import { useSafeAsyncEffect } from '../hooks/useSafeAsyncEffect';

/** Cached published areas for explore search + area pickers. */
export const useExplorePublishedAreas = (): AreaPublicDTO[] => {
  const [areas, setAreas] = useState<AreaPublicDTO[]>([]);

  useSafeAsyncEffect(async (isActive) => {
    try {
      const next = await fetchPublishedAreas();
      if (isActive()) {
        setAreas(next);
      }
    } catch {
      if (isActive()) {
        setAreas([]);
      }
    }
  }, []);

  return areas;
};
