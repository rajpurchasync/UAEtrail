import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  resolveMobileTabHeaderTitle,
  shouldShowMobileUnifiedTabHeader,
} from '../../config/mobileTabHeader';
import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { resolveMobileTabHeaderLeadingBack } from '../../utils/mobileBackNav';
import { ConsumerHeaderActions } from '../layout/ConsumerHeaderActions';
import { MobileUnifiedTabHeader } from './MobileUnifiedTabHeader';
import { useExploreMapChrome } from '../../explore/ExploreMapChromeContext';
import { useComposeImmersiveChrome } from '../../explore/create/ComposeImmersiveChromeContext';

/** Layout-mounted tab header — one chrome for Map, Profile, Activities, Messages. */
export const MobileTabHeader = () => {
  const { pathname, search, state } = useLocation();
  const { user } = useAuth();
  const { immersiveCompose } = useComposeImmersiveChrome();
  const exploreMapChrome = useExploreMapChrome();

  if (immersiveCompose) return null;
  const visible = shouldShowMobileUnifiedTabHeader(pathname, search, Boolean(user));
  const title = resolveMobileTabHeaderTitle(pathname, search);
  const center =
    pathname === EXPLORE_MAP_PATH
      ? { kind: 'brand' as const }
      : title
        ? { kind: 'title' as const, text: title }
        : null;

  if (!visible || !center) return null;

  const trailing = <ConsumerHeaderActions />;

  const leadingBack = resolveMobileTabHeaderLeadingBack(pathname, state, search);

  return (
    <MobileUnifiedTabHeader
      center={center}
      trailing={trailing}
      profileActive={pathname === '/profile'}
      leadingBack={leadingBack ?? undefined}
      onExploreBrandClick={
        pathname === EXPLORE_MAP_PATH
          ? () => exploreMapChrome?.requestClosePeek()
          : undefined
      }
    />
  );
};
