import { useEffect, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { fetchGeoTreeIntoStore } from '../hooks/geoHierarchyClientApi';
import { geoStore } from '../geo/geoStore';
import { geoNodePath, GEO_TREE_PATH } from '../config/routingCatalog';
import { ConsumerEntityDetailLoading } from '../detail/shell/ConsumerEntityDetailLoading';
import { DETAIL_LOADING_GEO } from '../content/detailLoadingCopy';
import { GEO_TREE_HEADER_CHROME } from '../geo/resolveGeoConsumerDetailHeaderChrome';
import { parseMobileBackNavState } from '../utils/mobileBackNav';
import { readDetailBackToFromLocation } from '@/discovery/discoverySessionExploreMapPeekNav';

/** Dedicated country URL `/geo/country/:code` — resolves UUID from the geo tree, then the node page. */
export const GeoCountryPage = () => {
  const { code = '' } = useParams();
  const location = useLocation();
  const [id, setId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setId(undefined);
    void fetchGeoTreeIntoStore().then(() => {
      if (cancelled) return;
      setId(geoStore.countryByCode(code)?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const backTo = readDetailBackToFromLocation(location.state) ?? GEO_TREE_PATH;
  const backLabel = parseMobileBackNavState(location.state)?.backLabel ?? 'Places';

  if (id === undefined) {
    return (
      <ConsumerEntityDetailLoading
        backTo={backTo}
        backLabel={backLabel}
        headerChrome={{ emoji: '🌍', label: 'Country' }}
        label={DETAIL_LOADING_GEO}
      />
    );
  }
  if (!id) {
    return (
      <ConsumerEntityDetailLoading
        backTo={GEO_TREE_PATH}
        backLabel="Places"
        headerChrome={GEO_TREE_HEADER_CHROME}
        label="Country not found"
      />
    );
  }
  return (
    <Navigate
      to={geoNodePath(id)}
      replace
      state={{
        ...location.state,
        ...parseMobileBackNavState(location.state),
        from: backTo,
        backLabel,
        detailBackTo: backTo,
      }}
    />
  );
};
