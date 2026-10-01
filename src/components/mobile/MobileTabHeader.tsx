import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  isMobileTabHeaderRoute,
  shouldShowMobileUnifiedTabHeader,
  type MobileTabHeaderCenter,
} from '../../config/mobileTabHeader';
import { joinedSubViewTitle } from '../../pages/activities/shared';
import { useOrganisationGate } from '../../hooks/useOrganisationGate';
import { memberCanManageHostedActivities } from '../../utils/hostedActivitiesGate';
import { MobileNotificationHeaderLink } from './MobileNotificationHeaderLink';
import { MobileUnifiedTabHeader } from './MobileUnifiedTabHeader';

const resolveCenter = (
  pathname: string,
  search: string,
  _canHost: boolean
): MobileTabHeaderCenter | null => {
  if (pathname === '/explore') return { kind: 'brand' };
  if (pathname === '/profile') return { kind: 'title', text: 'Profile' };
  if (pathname === '/trips' || pathname === '/activities') {
    const params = new URLSearchParams(search);
    const subTitle = joinedSubViewTitle(params.get('sub'));
    if (subTitle) return { kind: 'title', text: subTitle };
    return { kind: 'title', text: 'Trips' };
  }
  if (pathname === '/messages') return { kind: 'title', text: 'Messages' };
  if (!isMobileTabHeaderRoute(pathname)) return null;
  return null;
};

/** Layout-mounted tab header — one chrome for Map, Profile, Activities, Messages. */
export const MobileTabHeader = () => {
  const { pathname, search } = useLocation();
  const { user } = useAuth();
  const signedIn = Boolean(user);
  const gate = useOrganisationGate({ enabled: signedIn });
  const canHost = memberCanManageHostedActivities(user, gate.canPublish);

  const visible = shouldShowMobileUnifiedTabHeader(pathname, search, signedIn);
  const center = resolveCenter(pathname, search, canHost);

  if (!visible || !center) return null;

  const showNotifications =
    signedIn &&
    (pathname === '/explore' ||
      pathname === '/profile' ||
      pathname === '/activities' ||
      pathname === '/trips' ||
      pathname === '/messages');

  const trailing = showNotifications ? <MobileNotificationHeaderLink /> : null;

  return (
    <MobileUnifiedTabHeader
      center={center}
      trailing={trailing}
      profileActive={pathname === '/profile'}
    />
  );
};
