import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isConsumerChromeHidden } from '../../config/platform';
import { Header } from './Header';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';

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

  return (
    <div className="min-h-screen flex flex-col consumer-bg md:bg-white">
      {!isHomePage && !hideChrome && (
        <div className="hidden md:block">
          <Header />
        </div>
      )}
      <main
        className={`flex-grow scroll-touch ${showConsumerChrome ? 'pb-nav-safe md:pb-0' : ''}`}
      >
        {children}
      </main>
      {showConsumerChrome && (
        <div className="hidden md:block">
          <Footer />
        </div>
      )}
      <BottomNav />
    </div>
  );
};
