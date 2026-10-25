import { lazy, Suspense, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { resetAppScroll } from '../../config/layoutScroll';
import {
  applyViewReturnSnapshot,
  captureLeavingView,
  installViewReturnFocusCapture,
  peekViewReturnSnapshot,
  takeArmedViewReturn,
  viewReturnPathKey,
} from '../../utils/viewReturnMemory';
import { HomeDeferredMount } from '../home/marketing/HomeDeferredMount';

const ProductShell = lazy(() => import('./ProductShell').then((m) => ({ default: m.ProductShell })));
const Footer = lazy(() => import('./Footer').then((m) => ({ default: m.Footer })));

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navType = useNavigationType();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    installViewReturnFocusCapture();
  }, []);

  useLayoutEffect(() => {
    const pathKey = viewReturnPathKey(location.pathname, location.search);
    const leaving = previousPath.current;
    if (leaving && leaving !== pathKey) captureLeavingView(leaving);
    previousPath.current = pathKey;

    const armed = takeArmedViewReturn(pathKey);
    const snapshot = peekViewReturnSnapshot(pathKey);
    const shouldRestore = Boolean(snapshot) && (navType === 'POP' || armed != null);
    if (!shouldRestore || !snapshot) {
      resetAppScroll();
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let timer = 0;
    const tryRestore = () => {
      if (cancelled) return;
      const restored = applyViewReturnSnapshot(snapshot, armed?.focusSelector);
      if (restored || attempts >= 12) return;
      attempts += 1;
      timer = window.setTimeout(tryRestore, 80);
    };
    tryRestore();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [location.key, location.pathname, location.search, navType]);

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
