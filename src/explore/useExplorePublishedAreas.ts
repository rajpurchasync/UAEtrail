import { useEffect, useState } from 'react';
import type { AreaPublicDTO } from '@uaetrail/shared-types';
import { fetchPublishedAreas } from '../hooks/areaHubClientApi';

/** Cached published areas for explore search + area pickers. */
export const useExplorePublishedAreas = (): AreaPublicDTO[] => {
  const [areas, setAreas] = useState<AreaPublicDTO[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchPublishedAreas()
      .then((areas) => {
        if (!cancelled) setAreas(areas);
      })
      .catch(() => {
        if (!cancelled) setAreas([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return areas;
};
