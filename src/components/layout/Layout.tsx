import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ComposeRailProvider } from '../../context/ComposeRailContext';
import { isConsumerChromeHidden, hasConsumerSelfHeader } from '../../config/platform';
import { Footer } from './Footer';
import { ComposeRail } from './ComposeRail';
import { Header } from './Header';
import { MobileConsumerNavBar } from './MobileConsumerNavBar';
import { MobileMenuProvider } from './MobileMenu';
import { ApiStatusBanner } from './ApiStatusBanner';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isExploreMap = location.pathname === '/explore';
  const hideChrome = isConsumerChromeHidden(location.pathname);
  const showConsumerChrome = !hideChrome && !isExploreMap;
  const useDesktopShell = showConsumerChrome;

  if (isExploreMap) {
    return (
      <ComposeRailProvider>
        <MobileMenuProvider>
          <div className="flex h-[100dvh] w-full flex-col overflow-hidden consumer-bg">
            <ApiStatusBanner />
            <div className="hidden shrink-0 lg:block">
              <Header />
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
          </div>
        </MobileMenuProvider>
      </ComposeRailProvider>
    );
  }

  const showMobileConsumerNavBar =
    showConsumerChrome &&
    !hasConsumerSelfHeader(location.pathname);

  const main = (
    <main className="flex-1 scroll-touch min-w-0 max-w-full overflow-x-clip">
      {children}
    </main>
  );

  const siteFooter =
    showConsumerChrome && (
      <div className={`shrink-0 ${location.pathname === '/explore' ? 'hidden md:block' : ''}`}>
        <Footer />
      </div>
    );

  return (
    <ComposeRailProvider>
      <MobileMenuProvider>
        <div className="min-h-screen flex flex-col consumer-bg md:bg-gray-50 overflow-x-clip max-w-full">
          <ApiStatusBanner />
          {showMobileConsumerNavBar && <MobileConsumerNavBar />}
          {showConsumerChrome && location.pathname !== '/' && (
            <div className="hidden md:block shrink-0">
              <Header />
            </div>
          )}
          {useDesktopShell ? (
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
        </div>
      </MobileMenuProvider>
    </ComposeRailProvider>
  );
};
