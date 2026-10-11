import { useEffect, useState } from 'react';
import type { AreaPublicDTO } from '@uaetrail/shared-types';
import { areasApi } from '../api/domains/areas';

/** Cached published areas for explore search + area pickers. */
export const useExplorePublishedAreas = (): AreaPublicDTO[] => {
  const [areas, setAreas] = useState<AreaPublicDTO[]>([]);

  useEffect(() => {
    let cancelled = false;
    void areasApi
      .listPublishedAreas()
      .then((res) => {
        if (!cancelled) setAreas(res.data);
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
