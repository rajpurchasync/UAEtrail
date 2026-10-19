import { Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { canonicalPlaceDetailPath } from '@uaetrail/shared-types';
import {
  PRO_MEMBERSHIP_PATH,
  discoveryToExploreSearch,
  explorePath,
  exploreShopsPath,
  planWishlistRedirectPath,
} from '../config/routingCatalog';
import { PLAN_PATH } from '../config/surfacePaths';
import { resolveInboundTripsHubRedirect } from '../member-plan/inboundTripsRedirect';
import { useAuth } from '../context/AuthContext';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { memberCanManageHostedActivities } from '../utils/hostedActivitiesGate';
import { shopPublicPath } from '../utils/shopPaths';

/** Inbound `/messages` and `/publishing/messages` → `/chat`. */
export const InboundMessagesRedirect = () => {
  const { search, hash } = useLocation();
  return <Navigate to={`/chat${search}${hash}`} replace />;
};

/** Inbound place URLs (`/trail`, `/camp`, `/venue`, `/event`, …) → `/place/:id`. */
export const InboundCanonicalPlaceRedirect = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/explore" replace />;
  return <Navigate to={canonicalPlaceDetailPath(id)} replace />;
};

export const DiscoveryRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`${explorePath()}?${discoveryToExploreSearch(search)}`} replace />;
};

/** Inbound `/trips`, `/activities`, `/trips/map` → `/plan` or profile history. */
export const InboundTripsHubRedirect = () => {
  const { pathname, search } = useLocation();
  const { user } = useAuth();
  const gate = useMemberStatus({ enabled: Boolean(user) });
  const canHost = memberCanManageHostedActivities(user, gate.canAccessPublishingWorkspace);
  const target = resolveInboundTripsHubRedirect(pathname, search, { canHost });
  return <Navigate to={target ?? PLAN_PATH} replace />;
};

/** Inbound `/merchant/:id` → `/shop/:id`. */
export const InboundMerchantPublicRedirect = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to={exploreShopsPath()} replace />;
  return <Navigate to={shopPublicPath({ id })} replace />;
};

/** Inbound `/profile/wishlist` → plan wishlist lens. */
export const InboundProfileWishlistRedirect = () => (
  <Navigate to={planWishlistRedirectPath()} replace />
);

/** Inbound `/become-host` and `/become-organizer` → Pro membership. */
export const InboundProMembershipRedirect = () => {
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  return <Navigate to={`${PRO_MEMBERSHIP_PATH}${qs ? `?${qs}` : ''}`} replace />;
};
