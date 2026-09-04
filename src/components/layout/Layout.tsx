import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ComposeRailProvider } from '../../context/ComposeRailContext';
import { isConsumerChromeHidden, isMobileDetailRoute } from '../../config/platform';
import { Footer } from './Footer';
import { ComposeRail } from './ComposeRail';
import { Header } from './Header';
import { MobileConsumerNavBar } from './MobileConsumerNavBar';
import { MobileMenuProvider } from './MobileMenu';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const hideChrome = isConsumerChromeHidden(location.pathname);
  const showConsumerChrome = !hideChrome;
  const useDesktopShell = showConsumerChrome;

  const tabRootsWithBanner = new Set([
    '/activities',
    '/discovery',
    '/community',
    '/shop',
    '/profile',
    '/trail-points',
    '/my-rewards',
    '/groups',
    '/messages',
    '/notifications',
    '/favorites',
    '/my-requests',
  ]);

  const showMobileConsumerNavBar =
    showConsumerChrome &&
    location.pathname !== '/' &&
    !tabRootsWithBanner.has(location.pathname) &&
    !isMobileDetailRoute(location.pathname) &&
    !location.pathname.startsWith('/activity/') &&
    !location.pathname.startsWith('/trip/');

  const main = (
    <main className="flex-1 scroll-touch min-w-0 max-w-full overflow-x-clip">
      {children}
    </main>
  );

  const siteFooter =
    showConsumerChrome && (
      <div className="shrink-0">
        <Footer />
      </div>
    );

  return (
    <ComposeRailProvider>
      <MobileMenuProvider>
        <div className="min-h-screen flex flex-col consumer-bg md:bg-gray-50 overflow-x-clip max-w-full">
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
