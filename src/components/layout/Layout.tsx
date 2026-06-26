import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ComposeRailProvider } from '../../context/ComposeRailContext';
import { isConsumerChromeHidden, isMobileBannerChromeRoute, isMobileDetailRoute } from '../../config/platform';
import { Header } from './Header';
import { Footer } from './Footer';
import { ComposeRail } from './ComposeRail';
import { DesktopNavRail } from './DesktopNavRail';
import { MobileMenuProvider } from './MobileMenu';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isHomePage = location.pathname === '/';
  const hideChrome = isConsumerChromeHidden(location.pathname);
  const showConsumerChrome = !hideChrome;
  const useDesktopShell = showConsumerChrome;
  const showMobileHeader =
    !isHomePage && !hideChrome && !isMobileDetailRoute(location.pathname) && !isMobileBannerChromeRoute(location.pathname);

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
        {showMobileHeader && (
          <div className="md:hidden shrink-0">
            <Header />
          </div>
        )}

        {useDesktopShell ? (
          <div className="flex flex-1 min-h-0 w-full">
            <DesktopNavRail />
            <div className="flex flex-1 min-w-0 min-h-0 flex-col md:flex-row">
              <div className="flex flex-1 min-w-0 flex-col min-h-0">
                {main}
                {siteFooter}
              </div>
              <ComposeRail />
            </div>
          </div>
        ) : (
          <>
            {!isHomePage && !hideChrome && (
              <div className="hidden md:block shrink-0">
                <Header />
              </div>
            )}
            <div className="flex flex-1 flex-col min-h-0">
              {main}
              {siteFooter}
            </div>
          </>
        )}

        </div>
      </MobileMenuProvider>
    </ComposeRailProvider>
  );
};
