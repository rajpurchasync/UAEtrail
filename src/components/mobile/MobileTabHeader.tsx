import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  isMobileTabHeaderRoute,
  shouldShowMobileUnifiedTabHeader,
  type MobileTabHeaderCenter,
} from '../../config/mobileTabHeader';
import { joinedSubViewTitle } from '../../pages/activities/shared';
import { MobileNotificationHeaderLink } from './MobileNotificationHeaderLink';
import { MobileUnifiedTabHeader } from './MobileUnifiedTabHeader';

const resolveCenter = (pathname: string, search: string): MobileTabHeaderCenter | null => {
  if (pathname === '/explore') return { kind: 'brand' };
  if (pathname === '/profile') return { kind: 'title', text: 'Profile' };
  if (pathname === '/trips' || pathname === '/activities') {
    const params = new URLSearchParams(search);
    if (params.get('segment') === 'wishlist') return { kind: 'title', text: 'Wishlist' };
    if (params.get('segment') === 'past' || params.get('segment') === 'completed') {
      return { kind: 'title', text: 'Completed' };
    }
    if (params.get('role') === 'hosted' || params.get('tab') === 'hosted') {
      return { kind: 'title', text: 'Hosted' };
    }
    if (params.get('role') === 'self') return { kind: 'title', text: 'My plans' };
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

  const visible = shouldShowMobileUnifiedTabHeader(pathname, search, signedIn);
  const center = resolveCenter(pathname, search);

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
