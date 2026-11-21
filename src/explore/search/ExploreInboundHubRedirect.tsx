import { Navigate, useLocation } from 'react-router-dom';
import { exploreInboundHubRedirectTarget } from './exploreSearchRouting';

/** Inbound `/explore/hub/*` → canonical explore search / map. */
export const ExploreInboundHubRedirect = () => {
  const { pathname, search } = useLocation();
  return <Navigate to={exploreInboundHubRedirectTarget(pathname, search)} replace />;
};