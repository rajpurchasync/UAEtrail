import { useEffect, useState } from 'react';
import { fetchGeoTreeIntoStore } from './geoHierarchyClientApi';
import { geoStore } from '../geo/geoStore';
import { pickGeoAncestorLinks, type GeoAncestorLink } from '../geo/geoAncestorLinks';

export const useGeoAncestorLinks = (input: {
  region?: string | null;
  countryCode?: string | null;
}): GeoAncestorLink[] => {
  const [links, setLinks] = useState<GeoAncestorLink[]>([]);
  const region = input.region?.trim() ?? '';
  const countryCode = input.countryCode?.trim() ?? '';

  useEffect(() => {
    let cancelled = false;
    void fetchGeoTreeIntoStore()
      .then(() => {
        if (cancelled) return;
        setLinks(pickGeoAncestorLinks(geoStore.byId.values(), { region, countryCode }));
      })
      .catch(() => {
        if (!cancelled) setLinks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [region, countryCode]);

  return links;
};
