import { useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useProductLocation } from '../../routing/useEffectiveLocation';
import { ComposeRailProvider } from '../../context/ComposeRailContext';
import { isConsumerChromeHidden } from '../../config/platform';
import {
  APP_SCROLL_PANE_CLASS,
  APP_SCROLL_PANE_DELEGATED_CLASS,
  APP_SCROLL_ROOT_ID,
  isDelegatedProductScrollPath,
  PRODUCT_SHELL_HTML_CLASS,
} from '../../config/layoutScroll';
import { isJourneyMapPath } from '../../config/surfacePaths';
import { ADMIN_ACCOUNT_PATH, ADMIN_INBOX_PATH } from '../../config/adminSurfacePaths';
import { ComposeRail } from './ComposeRail';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileTabHeader } from '../mobile/MobileTabHeader';
import { MobileMenuProvider } from './MobileMenu';
import { ApiStatusBanner } from './ApiStatusBanner';
import { AuthUnavailableNotice } from '../auth/AuthUnavailableNotice';
import { ExploreMapChromeProvider } from '../../explore/ExploreMapChromeContext';
import { ComposeImmersiveChromeProvider } from '../../explore/create/ComposeImmersiveChromeContext';
import { CreateFlowProvider } from '../../create/CreateFlowProvider';
import { useAuth } from '../../context/AuthContext';
import { isConsumerProfilePath, isPlatformAdmin, isPlatformAdminConsolePath } from '../../utils/roles';
import { useIsMobile } from '../../hooks/useIsMobile';
import { shouldShowDesktopSideNav } from '../../config/desktopNav';
import { DesktopSideNav } from './desktop/DesktopSideNav';

const productViewportShellClass =
  'product-shell-viewport flex h-[100svh] w-full max-w-full flex-col overflow-hidden consumer-bg md:h-[100dvh] md:bg-gray-50';

/** Signed-in / product chrome — not used on guest marketing `/`. */
export const ProductShell = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const location = useProductLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    document.documentElement.classList.add(PRODUCT_SHELL_HTML_CLASS);
    return () => document.documentElement.classList.remove(PRODUCT_SHELL_HTML_CLASS);
  }, []);

  if (isPlatformAdmin(user?.role) && !isPlatformAdminConsolePath(location.pathname)) {
    return (
      <Navigate to={isConsumerProfilePath(location.pathname) ? ADMIN_ACCOUNT_PATH : ADMIN_INBOX_PATH} replace />
    );
  }
  const isExploreMap = location.pathname === '/explore';
  const isJourneyMap = isJourneyMapPath(location.pathname);
  const hideChrome = isConsumerChromeHidden(location.pathname);
  const showConsumerChrome = !hideChrome && !isExploreMap && !isJourneyMap;
  const delegatedScroll = isDelegatedProductScrollPath(location.pathname);

  const scrollPaneClass = delegatedScroll ? APP_SCROLL_PANE_DELEGATED_CLASS : APP_SCROLL_PANE_CLASS;

  const scrollableMain = (
    <main id={APP_SCROLL_ROOT_ID} className={scrollPaneClass}>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </main>
  );

  if (isExploreMap || isJourneyMap) {
    const showMapSideNav =
      !isMobile && shouldShowDesktopSideNav(location.pathname, Boolean(user));
    return (
      <ComposeRailProvider>
        <MobileMenuProvider>
          <ComposeImmersiveChromeProvider>
          <CreateFlowProvider>
          <ExploreMapChromeProvider>
            <div className={`${productViewportShellClass} md:bg-gray-50`}>
              <ApiStatusBanner />
              <AuthUnavailableNotice />
              {!isMobile ? (
                <div className="hidden shrink-0 md:block">
                  <Header />
                </div>
              ) : null}
              {isMobile ? <MobileTabHeader /> : null}
              <div className="flex min-h-0 flex-1 overflow-hidden">
                {showMapSideNav ? <DesktopSideNav /> : null}
                <div className="relative z-0 min-h-0 min-w-0 flex-1 isolate overflow-hidden">{children}</div>
              </div>
              <MobileBottomNav />
            </div>
          </ExploreMapChromeProvider>
          </CreateFlowProvider>
          </ComposeImmersiveChromeProvider>
        </MobileMenuProvider>
      </ComposeRailProvider>
    );
  }

  const showDesktopSideNav =
    !isMobile && showConsumerChrome && shouldShowDesktopSideNav(location.pathname, Boolean(user));

  return (
    <ComposeRailProvider>
      <MobileMenuProvider>
        <ComposeImmersiveChromeProvider>
        <CreateFlowProvider>
        <div className={productViewportShellClass}>
          <ApiStatusBanner />
          <AuthUnavailableNotice />
          {showConsumerChrome && !isMobile ? (
            <div className="hidden md:block shrink-0">
              <Header />
            </div>
          ) : null}
          {isMobile || !showConsumerChrome ? <MobileTabHeader /> : null}
          {showConsumerChrome ? (
            <div className="flex min-h-0 flex-1 w-full overflow-hidden md:flex-row">
              {showDesktopSideNav ? (
                <DesktopSideNav />
              ) : null}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                {scrollableMain}
              </div>
              <ComposeRail />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{scrollableMain}</div>
          )}
          <MobileBottomNav />
        </div>
        </CreateFlowProvider>
        </ComposeImmersiveChromeProvider>
      </MobileMenuProvider>
    </ComposeRailProvider>
  );
};
