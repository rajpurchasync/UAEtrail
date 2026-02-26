import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isHomePage = location.pathname === '/';
  const isDashboardRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/organizer') ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname === '/signin';

  return (
    <div className="min-h-screen flex flex-col">
      {!isHomePage && !isDashboardRoute && <Header />}
      <main className="flex-grow">{children}</main>
      {!isDashboardRoute && <Footer />}
    </div>
  );
};
