import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  const isDashboardRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/organizer') ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/merchant') ||
    location.pathname === '/signin' ||
    location.pathname === '/signup' ||
    location.pathname === '/verify' ||
    location.pathname === '/onboarding' ||
    location.pathname === '/forgot-password';

  return (
    <div className="min-h-screen flex flex-col">
      {!isHomePage && !isDashboardRoute && <Header />}
      <main className={`flex-grow ${!isDashboardRoute ? 'pb-nav-safe md:pb-0' : ''}`}>{children}</main>
      {!isDashboardRoute && <Footer />}
      <BottomNav />
    </div>
  );
};
