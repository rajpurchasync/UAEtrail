import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ComposeRailProvider } from '../../context/ComposeRailContext';
import { isConsumerChromeHidden } from '../../config/platform';
import { Header } from './Header';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';
import { ComposeRail } from './ComposeRail';
import { DesktopNavRail } from './DesktopNavRail';

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

  const main = (
    <main
      className={`flex-1 scroll-touch min-w-0 ${
        showConsumerChrome ? 'pb-nav-safe md:pb-0' : ''
      }`}
    >
      {children}
    </main>
  );

  const desktopFooter =
    showConsumerChrome && (
      <div className="hidden md:block shrink-0">
        <Footer />
      </div>
    );

  return (
    <ComposeRailProvider>
      <div className="min-h-screen flex flex-col consumer-bg md:bg-gray-50">
        {!isHomePage && !hideChrome && (
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
                {desktopFooter}
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
              {showConsumerChrome && (
                <div className="hidden md:block shrink-0">
                  <Footer />
                </div>
              )}
            </div>
          </>
        )}

        <BottomNav />
      </div>
    </ComposeRailProvider>
  );
};
