import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  isMobileTabHeaderRoute,
  shouldShowMobileUnifiedTabHeader,
  type MobileTabHeaderCenter,
} from '../../config/mobileTabHeader';
import {
  ACTIVITIES_PATH,
  EXPLORE_MAP_PATH,
  MESSAGES_PATH,
  PLAN_PATH,
  TRIPS_PATH,
  isJourneyMapPath,
  isProfileHistoryListPath,
} from '../../config/routingCatalog';
import { joinedSubViewTitle } from '../../pages/activities/shared';
import { useMemberStatus } from '../../hooks/useMemberStatus';
import { memberCanManageHostedActivities } from '../../utils/hostedActivitiesGate';
import { PRODUCT_PLAN_SURFACE_TITLE } from '../../content/productNorthStar';
import { ConsumerHeaderActions } from '../layout/ConsumerHeaderActions';
import { MobileUnifiedTabHeader } from './MobileUnifiedTabHeader';

const resolveCenter = (
  pathname: string,
  search: string,
  _canHost: boolean
): MobileTabHeaderCenter | null => {
  if (pathname === EXPLORE_MAP_PATH) return { kind: 'brand' };
  if (pathname === '/profile') return { kind: 'title', text: 'Profile' };
  if (pathname === PLAN_PATH || pathname === TRIPS_PATH || pathname === ACTIVITIES_PATH) {
    const params = new URLSearchParams(search);
    const subTitle = joinedSubViewTitle(params.get('sub'));
    if (subTitle) return { kind: 'title', text: subTitle };
    return { kind: 'title', text: PRODUCT_PLAN_SURFACE_TITLE };
  }
  if (isProfileHistoryListPath(pathname) || isJourneyMapPath(pathname)) {
    return { kind: 'title', text: isJourneyMapPath(pathname) ? 'My Map' : 'History' };
  }
  if (pathname === MESSAGES_PATH) return { kind: 'title', text: 'Chat' };
  if (!isMobileTabHeaderRoute(pathname)) return null;
  return null;
};

/** Layout-mounted tab header — one chrome for Map, Profile, Activities, Messages. */
export const MobileTabHeader = () => {
  const { pathname, search } = useLocation();
  const { user } = useAuth();
  const gate = useMemberStatus({ enabled: Boolean(user) });
  const canHost = memberCanManageHostedActivities(user, gate.canAccessPublishingWorkspace);

  const visible = shouldShowMobileUnifiedTabHeader(pathname, search, Boolean(user));
  const center = resolveCenter(pathname, search, canHost);

  if (!visible || !center) return null;

  const showHeaderActions =
    pathname === EXPLORE_MAP_PATH ||
    pathname === '/profile' ||
    pathname === ACTIVITIES_PATH ||
    pathname === PLAN_PATH ||
    pathname === TRIPS_PATH ||
    isProfileHistoryListPath(pathname) ||
    isJourneyMapPath(pathname) ||
    pathname === MESSAGES_PATH;

  const trailing = showHeaderActions ? <ConsumerHeaderActions /> : null;

  return (
    <MobileUnifiedTabHeader
      center={center}
      trailing={trailing}
      profileActive={pathname === '/profile'}
    />
  );
};
