import { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { ComposeRailProvider } from '../../context/ComposeRailContext';
import {
  hasConsumerSelfHeader,
  isConsumerChromeHidden,
  shouldShowMarketingSiteFooter,
} from '../../config/platform';
import { isJourneyMapPath } from '../../config/surfacePaths';
import { useMobileBottomNav } from '../../hooks/useMobileBottomNav';
import { Footer } from './Footer';
import { ComposeRail } from './ComposeRail';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileTabHeader } from '../mobile/MobileTabHeader';
import { MobileConsumerNavBar } from './MobileConsumerNavBar';
import { MobileMenuProvider } from './MobileMenu';
import { ApiStatusBanner } from './ApiStatusBanner';

/** Signed-in / product chrome — not used on guest marketing `/`. */
export const ProductShell = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const showMobileBottomNav = useMobileBottomNav();
  const isExploreMap = location.pathname === '/explore';
  const isJourneyMap = isJourneyMapPath(location.pathname);
  const hideChrome = isConsumerChromeHidden(location.pathname);
  const showConsumerChrome = !hideChrome && !isExploreMap && !isJourneyMap;

  if (isExploreMap || isJourneyMap) {
    return (
      <ComposeRailProvider>
        <MobileMenuProvider>
          <div className="flex h-[100dvh] w-full flex-col overflow-hidden consumer-bg">
            <ApiStatusBanner />
            <div className="hidden shrink-0 lg:block">
              <Header />
            </div>
            <MobileTabHeader />
            <div className="relative z-0 min-h-0 flex-1 isolate overflow-hidden">{children}</div>
            <MobileBottomNav />
          </div>
        </MobileMenuProvider>
      </ComposeRailProvider>
    );
  }

  const showMobileConsumerNavBar = showConsumerChrome && !hasConsumerSelfHeader(location.pathname);

  const main = (
    <main className="flex-1 scroll-touch min-w-0 max-w-full overflow-x-clip">{children}</main>
  );

  const siteFooter = shouldShowMarketingSiteFooter(location.pathname, {
    showConsumerChrome,
    showMobileBottomNav,
  }) ? (
    <div className="shrink-0">
      <Footer />
    </div>
  ) : null;

  return (
    <ComposeRailProvider>
      <MobileMenuProvider>
        <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-clip consumer-bg md:bg-gray-50">
          <ApiStatusBanner />
          {showMobileConsumerNavBar && <MobileConsumerNavBar />}
          {showConsumerChrome ? (
            <div className="hidden md:block shrink-0">
              <Header />
            </div>
          ) : null}
          <MobileTabHeader />
          {showConsumerChrome ? (
            <div className="flex flex-1 min-h-0 w-full md:flex-row">
              <div className="flex flex-1 min-w-0 flex-col min-h-0">
                {main}
                {siteFooter}
              </div>
              <ComposeRail />
            </div>
          ) : (
            <div className="flex flex-1 flex-col min-h-0">
              {main}
              {siteFooter}
            </div>
          )}
          <MobileBottomNav />
        </div>
      </MobileMenuProvider>
    </ComposeRailProvider>
  );
};
