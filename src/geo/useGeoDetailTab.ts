import { useSearchParams } from 'react-router-dom';
import {
  GEO_HUB_TAB_QUERY,
  parseGeoHubTabParam,
  type GeoHubTabId,
} from './geoHubTab';

export const useGeoDetailTab = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseGeoHubTabParam(searchParams.get(GEO_HUB_TAB_QUERY));
  const onTabChange = (tab: GeoHubTabId) => {
    const next = new URLSearchParams(searchParams);
    next.set(GEO_HUB_TAB_QUERY, tab);
    setSearchParams(next, { replace: true });
  };
  return { activeTab, onTabChange };
};
