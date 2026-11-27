import { useEffect, useState } from 'react';
import type { GeoRef } from '@uaetrail/shared-types';
import { fetchGeoTreeIntoStore } from './geoHierarchyClientApi';
import { geoStore } from '../geo/geoStore';
import { pickGeoAncestorLinks, type GeoAncestorLink } from '../geo/geoAncestorLinks';
import { pickGeoRefAncestorLinks } from '../geo/geoRefAncestorLinks';

export const useGeoAncestorLinks = (input: {
  region?: string | null;
  countryCode?: string | null;
  geoRef?: GeoRef | null;
}): GeoAncestorLink[] => {
  const [links, setLinks] = useState<GeoAncestorLink[]>([]);
  const region = input.region?.trim() ?? '';
  const countryCode = input.countryCode?.trim() ?? '';
  const geoRef = input.geoRef;
  const geoRefPath = geoRef?.path?.trim() ?? '';
  const geoRefChainKey = geoRef?.chain?.join('/') ?? '';

  useEffect(() => {
    let cancelled = false;
    void fetchGeoTreeIntoStore()
      .then(() => {
        if (cancelled) return;
        const nodes = geoStore.byId.values();
        const fromRef = pickGeoRefAncestorLinks(nodes, geoRef);
        setLinks(
          fromRef.length > 0
            ? fromRef
            : pickGeoAncestorLinks(nodes, { region, countryCode })
        );
      })
      .catch(() => {
        if (!cancelled) setLinks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [region, countryCode, geoRefPath, geoRef, geoRefChainKey]);

  return links;
};
