import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { shouldShowMobileUnifiedTabHeader } from '../../config/mobileTabHeader';
import { resolveMobileTabHeaderLeadingBack } from '../../utils/mobileBackNav';
import { ConsumerHeaderActions } from '../layout/ConsumerHeaderActions';
import { MobileUnifiedTabHeader } from './MobileUnifiedTabHeader';
import { useComposeImmersiveChrome } from '@/discovery/discoveryPortExploreComposeImmersiveChrome';
import { isExploreSearchResultsPath } from '@/discovery/discoveryPortExploreSearchRouting';
import { isFindCrewDiscoveryListPath } from '../../discovery/discoverySession';

/** Layout-mounted tab header — one chrome for Map, Profile, Activities, Messages. */
export const MobileTabHeader = () => {
  const { pathname, search, state } = useLocation();
  const { user } = useAuth();
  const { immersiveCompose } = useComposeImmersiveChrome();
  if (immersiveCompose) return null;
  if (isExploreSearchResultsPath(pathname)) return null;
  if (isFindCrewDiscoveryListPath(pathname, search)) return null;
  const visible = shouldShowMobileUnifiedTabHeader(pathname, search, Boolean(user));
  if (!visible) return null;

  const trailing = <ConsumerHeaderActions />;
  const leadingBack = resolveMobileTabHeaderLeadingBack(pathname, state, search);

  return (
    <MobileUnifiedTabHeader
      trailing={trailing}
      profileActive={pathname === '/profile'}
      leadingBack={leadingBack ?? undefined}
    />
  );
};