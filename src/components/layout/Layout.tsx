import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { resetAppScroll } from '../../config/layoutScroll';
import { HomeDeferredMount } from '../home/marketing/HomeDeferredMount';

const ProductShell = lazy(() => import('./ProductShell').then((m) => ({ default: m.ProductShell })));
const Footer = lazy(() => import('./Footer').then((m) => ({ default: m.Footer })));

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  useEffect(() => {
    resetAppScroll();
  }, [location.pathname]);

  if (location.pathname === '/') {
    return (
      <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-clip max-md:bg-white md:bg-gray-50">
        <main className="flex-1 scroll-touch min-w-0 max-w-full overflow-x-clip">{children}</main>
        <HomeDeferredMount minHeightClass="min-h-[12rem]" rootMargin="0px">
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </HomeDeferredMount>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-[100dvh] w-full flex-col overflow-hidden consumer-bg">{children}</div>
      }
    >
      <ProductShell>{children}</ProductShell>
    </Suspense>
  );
};
