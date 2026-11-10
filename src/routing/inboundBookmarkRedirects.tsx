import { Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { canonicalPlaceDetailPath, inboundKindPlaceDetailPath } from '@uaetrail/shared-types';
import {
  PRO_MEMBERSHIP_PATH,
  discoveryToExploreSearch,
  explorePath,
  exploreShopsPath,
  planWishlistRedirectPath,
} from '../config/routingCatalog';
import { INBOUND_RETIRED_CONSOLE_PREFIXES } from '../config/inboundRoutePaths';
import { EXPLORE_MAP_PATH } from '../config/routingCatalog';
import {
  JOURNEY_MAP_PATH,
  PROFILE_HISTORY_PATH,
  PUBLISHING_CONSOLE_PREFIX,
  inboundNotificationsRedirectTarget,
  inboundProfileSettingsRedirectTarget,
} from '../config/surfacePaths';
import { shopPublicPath } from '../utils/shopPaths';

/** Inbound `/messages` and `/publishing/messages` → `/chat`. */
export const InboundMessagesRedirect = () => {
  const { search, hash } = useLocation();
  return <Navigate to={`/chat${search}${hash}`} replace />;
};

/** Inbound `/trail` `/camp` → `/place/:id`. Event aliases → `/venue/:id` (live hub, not `/place`). */
export const InboundCanonicalPlaceRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
  if (!id) return <Navigate to={EXPLORE_MAP_PATH} replace />;
  if (/^\/(event|event-spot|community-activity)(\/|$)/.test(pathname)) {
    return <Navigate to={inboundKindPlaceDetailPath('event', id)} replace />;
  }
  return <Navigate to={canonicalPlaceDetailPath(id)} replace />;
};

export const DiscoveryRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`${explorePath()}?${discoveryToExploreSearch(search)}`} replace />;
};

/** `/host/*`, `/operator/*`, `/organizer/*` → `/publishing/*` (retired console prefixes). */
export const InboundRetiredPublishingConsoleRedirect = () => {
  const { pathname, search, hash } = useLocation();
  const prefix = INBOUND_RETIRED_CONSOLE_PREFIXES.find(
    (candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`)
  );
  if (!prefix) {
    return <Navigate to={EXPLORE_MAP_PATH} replace />;
  }
  const suffix = pathname.slice(prefix.length) || '/overview';
  return <Navigate to={`${PUBLISHING_CONSOLE_PREFIX}${suffix}${search}${hash}`} replace />;
};

/** Inbound `/product/:id` — product catalog removed; send guests to shop browse. */
export const InboundProductPathRedirect = () => <Navigate to={exploreShopsPath()} replace />;

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

/** `/profile/my-trips` bookmarks → outing history. */
export const InboundProfileHistoryAliasRedirect = () => (
  <Navigate to={PROFILE_HISTORY_PATH} replace />
);

/** `/profile/my-trips/map` bookmarks → journey map. */
export const InboundJourneyMapAliasRedirect = () => <Navigate to={JOURNEY_MAP_PATH} replace />;

/** `/profile/settings/*` bookmarks → `/settings/*` (preserve query + hash). */
export const InboundLegacyProfileSettingsRedirect = () => {
  const { pathname, search, hash } = useLocation();
  return <Navigate to={`${inboundProfileSettingsRedirectTarget(pathname)}${search}${hash}`} replace />;
};

/** `/notifications/*` bookmarks → `/settings/notifications/*` (preserve query + hash). */
export const InboundLegacyNotificationsRedirect = () => {
  const { pathname, search, hash } = useLocation();
  return <Navigate to={`${inboundNotificationsRedirectTarget(pathname)}${search}${hash}`} replace />;
};
