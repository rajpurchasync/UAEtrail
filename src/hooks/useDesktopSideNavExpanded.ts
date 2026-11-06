import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { applyPanelResizeCursor, clearPanelResizeCursor } from '../config/panelResizeCursor';

const EXPANDED_KEY = 'uaetrail.desktopNav.expanded';
const WIDTH_KEY = 'uaetrail.desktopNav.width';
const WIDE_QUERY = '(min-width: 1280px)';

export const DESKTOP_SIDE_NAV_COLLAPSED_WIDTH = 72;
export const DESKTOP_SIDE_NAV_DEFAULT_WIDTH = 256;
export const DESKTOP_SIDE_NAV_MIN_WIDTH = 72;
export const DESKTOP_SIDE_NAV_MAX_WIDTH = 380;
const LABEL_WIDTH = 160;

const clampWidth = (value: number) =>
  Math.min(DESKTOP_SIDE_NAV_MAX_WIDTH, Math.max(DESKTOP_SIDE_NAV_MIN_WIDTH, Math.round(value)));

const readExpanded = (): boolean | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(EXPANDED_KEY);
  if (raw === '1') return true;
  if (raw === '0') return false;
  return null;
};

const readWidth = (): number | null => {
  if (typeof window === 'undefined') return null;
  const raw = Number(window.localStorage.getItem(WIDTH_KEY));
  return Number.isFinite(raw) && raw > 0 ? clampWidth(raw) : null;
};

const defaultExpanded = (): boolean => {
  const stored = readExpanded();
  if (stored != null) return stored;
  return typeof window !== 'undefined' ? window.matchMedia(WIDE_QUERY).matches : true;
};

const defaultWidth = (): number => {
  const stored = readWidth();
  if (stored != null) return stored;
  return defaultExpanded() ? DESKTOP_SIDE_NAV_DEFAULT_WIDTH : DESKTOP_SIDE_NAV_COLLAPSED_WIDTH;
};

const persist = (expanded: boolean, width: number) => {
  try {
    window.localStorage.setItem(EXPANDED_KEY, expanded ? '1' : '0');
    window.localStorage.setItem(WIDTH_KEY, String(width));
  } catch {
    /* ignore quota / private mode */
  }
};

export const DESKTOP_SIDE_NAV_SYNC_EVENT = 'uaetrail:desktop-side-nav-sync';

/** Collapse icon rail — e.g. guest gated map column needs horizontal space. */
export const collapseDesktopSideNav = () => {
  persist(false, DESKTOP_SIDE_NAV_COLLAPSED_WIDTH);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DESKTOP_SIDE_NAV_SYNC_EVENT));
  }
};

/** User-sized left nav; remembered. Collapse snaps to the icon rail. */
export const useDesktopSideNavExpanded = () => {
  const [width, setWidth] = useState(defaultWidth);
  const lastExpandedWidthRef = useRef(
    Math.max(DESKTOP_SIDE_NAV_DEFAULT_WIDTH, defaultWidth() === DESKTOP_SIDE_NAV_COLLAPSED_WIDTH
      ? DESKTOP_SIDE_NAV_DEFAULT_WIDTH
      : defaultWidth())
  );
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const next = defaultWidth();
    setWidth(next);
    if (next > DESKTOP_SIDE_NAV_COLLAPSED_WIDTH) lastExpandedWidthRef.current = next;
    const sync = () => setWidth(defaultWidth());
    window.addEventListener(DESKTOP_SIDE_NAV_SYNC_EVENT, sync);
    return () => {
      window.removeEventListener(DESKTOP_SIDE_NAV_SYNC_EVENT, sync);
      clearPanelResizeCursor();
    };
  }, []);

  const expanded = width > DESKTOP_SIDE_NAV_COLLAPSED_WIDTH;
  const compact = width < LABEL_WIDTH;

  const commitWidth = useCallback((next: number) => {
    const clamped = clampWidth(next);
    setWidth(clamped);
    if (clamped > DESKTOP_SIDE_NAV_COLLAPSED_WIDTH) lastExpandedWidthRef.current = clamped;
    persist(clamped > DESKTOP_SIDE_NAV_COLLAPSED_WIDTH, clamped);
  }, []);

  const toggleExpanded = useCallback(() => {
    if (expanded) commitWidth(DESKTOP_SIDE_NAV_COLLAPSED_WIDTH);
    else commitWidth(lastExpandedWidthRef.current);
  }, [commitWidth, expanded]);

  const onResizePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      event.preventDefault();
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      dragRef.current = { startX: event.clientX, startWidth: width };
      applyPanelResizeCursor();
    },
    [width]
  );

  const onResizePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!dragRef.current) return;
      commitWidth(dragRef.current.startWidth + (event.clientX - dragRef.current.startX));
    },
    [commitWidth]
  );

  const onResizePointerUp = useCallback((event: PointerEvent<HTMLElement>) => {
    dragRef.current = null;
    clearPanelResizeCursor();
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
  }, []);

  const onResizeKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const step = event.shiftKey ? 32 : 16;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        commitWidth(width + step);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        commitWidth(width - step);
      } else if (event.key === 'Home') {
        event.preventDefault();
        commitWidth(DESKTOP_SIDE_NAV_COLLAPSED_WIDTH);
      } else if (event.key === 'End') {
        event.preventDefault();
        commitWidth(DESKTOP_SIDE_NAV_MAX_WIDTH);
      }
    },
    [commitWidth, width]
  );

  return {
    width,
    expanded,
    compact,
    toggleExpanded,
    onResizePointerDown,
    onResizePointerMove,
    onResizePointerUp,
    onResizeKeyDown,
  };
};
