import { useEffect, useState } from 'react';
import { fetchGeoTreeIntoStore } from '../../hooks/geoHierarchyClientApi';
import { geoStore } from '../../geo/geoStore';

/** Load `GET /geo/tree` when browse scope uses `?geo=` so chip labels resolve from registry nodes. */
export const useBrowseGeoScopeHydration = (geoPath: readonly string[]): number => {
  const active = geoPath.length > 0;
  const pathKey = geoPath.join('/');
  const [version, setVersion] = useState(geoStore.version);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void fetchGeoTreeIntoStore().then(() => {
      if (!cancelled) setVersion(geoStore.version);
    });
    return () => {
      cancelled = true;
    };
  }, [active, pathKey]);

  return version;
};