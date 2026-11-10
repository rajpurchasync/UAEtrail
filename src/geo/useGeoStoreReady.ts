import { useEffect, useState } from 'react';
import { fetchGeoTreeIntoStore } from '../hooks/geoHierarchyClientApi';
import { geoStore } from './geoStore';

/** Hydrate the geo tree once so browse filters can drill emirate → area → venue. */
export const useGeoStoreReady = (): number => {
  const [version, setVersion] = useState(geoStore.version);
  useEffect(() => {
    let cancelled = false;
    void fetchGeoTreeIntoStore().then(() => {
      if (!cancelled) setVersion(geoStore.version);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return version;
};
