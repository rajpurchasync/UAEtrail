import { Navigate, useLocation } from 'react-router-dom';
import { exploreHubLegacyRedirectTarget } from './exploreSearchRouting';

/** Inbound `/explore/hub/*` → canonical explore search / map. */
export const ExploreHubLegacyRedirect = () => {
  const { pathname, search } = useLocation();
  return <Navigate to={exploreHubLegacyRedirectTarget(pathname, search)} replace />;
};