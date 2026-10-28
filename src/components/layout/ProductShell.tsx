import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { ComposeRailProvider } from '../../context/ComposeRailContext';
import {
  hasConsumerSelfHeader,
  isConsumerChromeHidden,
  isConsumerEntityDetailRoute,
} from '../../config/platform';
import {
  APP_SCROLL_PANE_CLASS,
  APP_SCROLL_PANE_DELEGATED_CLASS,
  APP_SCROLL_ROOT_ID,
  isDelegatedProductScrollPath,
  PRODUCT_SHELL_HTML_CLASS,
} from '../../config/layoutScroll';
import { isJourneyMapPath } from '../../config/surfacePaths';
import { ComposeRail } from './ComposeRail';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileTabHeader } from '../mobile/MobileTabHeader';
import { MobileConsumerNavBar } from './MobileConsumerNavBar';
import { MobileMenuProvider } from './MobileMenu';
import { ApiStatusBanner } from './ApiStatusBanner';
import { ExploreMapChromeProvider } from '../../explore/ExploreMapChromeContext';
import { ComposeImmersiveChromeProvider } from '../../explore/create/ComposeImmersiveChromeContext';

const productViewportShellClass =
  'flex h-[100dvh] w-full max-w-full flex-col overflow-hidden consumer-bg md:bg-gray-50';

/** Signed-in / product chrome — not used on guest marketing `/`. */
export const ProductShell = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    document.documentElement.classList.add(PRODUCT_SHELL_HTML_CLASS);
    return () => document.documentElement.classList.remove(PRODUCT_SHELL_HTML_CLASS);
  }, []);

  const location = useLocation();
  const isExploreMap = location.pathname === '/explore';
  const isJourneyMap = isJourneyMapPath(location.pathname);
  const hideChrome = isConsumerChromeHidden(location.pathname);
  const showConsumerChrome = !hideChrome && !isExploreMap && !isJourneyMap;
  const delegatedScroll = isDelegatedProductScrollPath(location.pathname);

  const scrollPaneClass = delegatedScroll ? APP_SCROLL_PANE_DELEGATED_CLASS : APP_SCROLL_PANE_CLASS;

  const scrollableMain = (
    <main id={APP_SCROLL_ROOT_ID} className={scrollPaneClass}>
      <div className="flex h-full min-h-0 flex-col">{children}</div>
    </main>
  );

  if (isExploreMap || isJourneyMap) {
    return (
      <ComposeRailProvider>
        <MobileMenuProvider>
          <ComposeImmersiveChromeProvider>
          <ExploreMapChromeProvider>
            <div className={`${productViewportShellClass} md:bg-gray-50`}>
              <ApiStatusBanner />
              <div className="hidden shrink-0 lg:block">
                <Header />
              </div>
              <MobileTabHeader />
              <div className="relative z-0 min-h-0 flex-1 isolate overflow-hidden">{children}</div>
              <MobileBottomNav />
            </div>
          </ExploreMapChromeProvider>
          </ComposeImmersiveChromeProvider>
        </MobileMenuProvider>
      </ComposeRailProvider>
    );
  }

  const showMobileConsumerNavBar =
    showConsumerChrome &&
    !hasConsumerSelfHeader(location.pathname) &&
    !isConsumerEntityDetailRoute(location.pathname);

  return (
    <ComposeRailProvider>
      <MobileMenuProvider>
        <ComposeImmersiveChromeProvider>
        <div className={productViewportShellClass}>
          <ApiStatusBanner />
          {showMobileConsumerNavBar && <MobileConsumerNavBar />}
          {showConsumerChrome ? (
            <div className="hidden md:block shrink-0">
              <Header />
            </div>
          ) : null}
          <MobileTabHeader />
          {showConsumerChrome ? (
            <div className="flex min-h-0 flex-1 w-full overflow-hidden md:flex-row">
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
        </ComposeImmersiveChromeProvider>
      </MobileMenuProvider>
    </ComposeRailProvider>
  );
};
