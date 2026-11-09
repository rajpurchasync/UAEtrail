import { lazy, Suspense, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { APP_SCROLL_ROOT_ID, resetAppScroll, shouldResetAppScrollOnNavigation } from '../../config/layoutScroll';
import {
  applyViewReturnSnapshot,
  installViewReturnFocusCapture,
  peekViewReturnSnapshot,
  rememberViewScroll,
  sealLeavingView,
  takeArmedViewReturn,
  viewReturnPathKey,
  type ViewReturnSnapshot,
} from '../../utils/viewReturnMemory';
import { HomeDeferredMount } from '../home/marketing/HomeDeferredMount';
import { getBackStack, recordNavigation, skipTransientIfPoppedOnto } from '../../utils/backStack';
import { resetModalA11yState } from '../../hooks/useModalA11y';

const ProductShell = lazy(() => import('./ProductShell').then((m) => ({ default: m.ProductShell })));
const Footer = lazy(() => import('./Footer').then((m) => ({ default: m.Footer })));

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();
  const previousPath = useRef<string | null>(null);
  const recordedKey = useRef<string | null>(null);
  const skippedTransientKey = useRef<string | null>(null);
  const stackIndexBeforeNav = useRef(-1);
  const restoringRef = useRef<{
    pathname: string;
    snapshot: ViewReturnSnapshot;
    focusSelector: string | null;
    at: number;
  } | null>(null);

  // Record before children render so back controls on the new page already see
  // this entry on the in-app stack (effects would run after the children).
  if (recordedKey.current !== location.key) {
    stackIndexBeforeNav.current = getBackStack().index;
    recordedKey.current = location.key;
    recordNavigation(location.key, viewReturnPathKey(location.pathname, location.search), navType);
  }

  useEffect(() => {
    installViewReturnFocusCapture();
  }, []);

  useEffect(() => {
    const pathKey = viewReturnPathKey(location.pathname, location.search);
    const root = document.getElementById(APP_SCROLL_ROOT_ID);
    if (!root) return;
    const sync = () => {
      if (viewReturnPathKey(window.location.pathname, window.location.search) !== pathKey) return;
      rememberViewScroll(pathKey);
    };
    root.addEventListener('scroll', sync, { capture: true, passive: true });
    return () => root.removeEventListener('scroll', sync, true);
  }, [location.pathname, location.search]);

  useLayoutEffect(() => {
    resetModalA11yState();
    const pathKey = viewReturnPathKey(location.pathname, location.search);
    const leaving = previousPath.current;
    if (leaving && leaving !== pathKey) sealLeavingView(leaving);
    previousPath.current = pathKey;

    // Only skip when browser history actually moved backward. A typed/pasted
    // URL is also reported as POP by the router, but the stack index grows —
    // the member meant to open that form, not skip it.
    const movedBack = getBackStack().index < stackIndexBeforeNav.current;
    if (
      navType === 'POP' &&
      movedBack &&
      skippedTransientKey.current !== location.key &&
      skipTransientIfPoppedOnto(navigate, pathKey, leaving)
    ) {
      skippedTransientKey.current = location.key;
      return;
    }

    const armed = takeArmedViewReturn(pathKey);
    let snapshot = peekViewReturnSnapshot(pathKey);
    let focusSelector = armed?.focusSelector ?? null;
    let shouldRestore = Boolean(snapshot) && (navType === 'POP' || armed != null);

    // A page that normalises its own query string on mount (`setSearchParams(…, { replace: true })`)
    // must not wipe the scroll/focus we just restored for it — carry that restore over.
    const carried = restoringRef.current;
    if (
      !shouldRestore &&
      navType === 'REPLACE' &&
      carried &&
      carried.pathname === location.pathname &&
      Date.now() - carried.at < 2000
    ) {
      snapshot = carried.snapshot;
      focusSelector = carried.focusSelector;
      shouldRestore = true;
    }

    if (!shouldRestore || !snapshot) {
      restoringRef.current = null;
      const previousPathname = leaving?.split('?')[0] ?? null;
      if (shouldResetAppScrollOnNavigation(previousPathname, location.pathname)) {
        resetAppScroll();
      }
      return;
    }
    restoringRef.current = { pathname: location.pathname, snapshot, focusSelector, at: Date.now() };

    const restoreSnapshot = snapshot;
    let cancelled = false;
    let attempts = 0;
    let timer = 0;
    const tryRestore = () => {
      if (cancelled) return;
      const restored = applyViewReturnSnapshot(restoreSnapshot, focusSelector);
      if (restored || attempts >= 12) return;
      attempts += 1;
      timer = window.setTimeout(tryRestore, 80);
    };
    tryRestore();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [location.key, location.pathname, location.search, navType, navigate]);

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
