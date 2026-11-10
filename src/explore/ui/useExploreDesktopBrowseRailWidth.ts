import { useCallback, useEffect, useRef, useState } from 'react';
import { applyPanelResizeCursor, clearPanelResizeCursor } from '../../config/panelResizeCursor';
import {
  EXPLORE_BROWSE_RAIL_DEFAULT_WIDTH,
  clampExploreBrowseRailWidth,
  exploreCrewPanelDefaultWidth,
} from './exploreDesktopBrowseRailWidth';

export const readStoredExploreBrowseRailWidth = (
  storageKey: string,
  defaultWidth: number = EXPLORE_BROWSE_RAIL_DEFAULT_WIDTH
): number => {
  if (typeof window === 'undefined') return defaultWidth;
  const raw = Number.parseInt(window.localStorage.getItem(storageKey) ?? '', 10);
  if (!Number.isFinite(raw)) return defaultWidth;
  return clampExploreBrowseRailWidth(raw);
};

const persistBrowseRailWidth = (storageKey: string, width: number) => {
  try {
    window.localStorage.setItem(storageKey, String(width));
  } catch {
    /* ignore quota */
  }
};

type Options = {
  storageKey: string;
  defaultWidth?: number;
  /** When false, drag handle should not start resize (e.g. list drawer maximized). */
  resizable?: boolean;
  /** Bump map layout when width or rail mode changes. */
  notifyMapLayout?: boolean;
};

/** Shared persisted width + drag-to-resize for desktop explore left rails. */
export const useExploreDesktopBrowseRailWidth = ({
  storageKey,
  defaultWidth = exploreCrewPanelDefaultWidth(),
  resizable = true,
  notifyMapLayout = true,
}: Options) => {
  const [width, setWidth] = useState(() => readStoredExploreBrowseRailWidth(storageKey, defaultWidth));
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const onResize = () => setWidth((current) => clampExploreBrowseRailWidth(current));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (notifyMapLayout) window.dispatchEvent(new Event('resize'));
  }, [width, notifyMapLayout]);

  const onPointerMove = useCallback((event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    setWidth(clampExploreBrowseRailWidth(drag.startWidth + (event.clientX - drag.startX)));
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    clearPanelResizeCursor();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    setWidth((current) => {
      persistBrowseRailWidth(storageKey, current);
      return current;
    });
    window.dispatchEvent(new Event('resize'));
  }, [onPointerMove, storageKey]);

  const onHandlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!resizable) return;
      event.preventDefault();
      dragRef.current = { startX: event.clientX, startWidth: width };
      applyPanelResizeCursor();
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [onPointerMove, onPointerUp, resizable, width]
  );

  const nudgeWidth = useCallback((delta: number) => {
    setWidth((current) => {
      const next = clampExploreBrowseRailWidth(current + delta);
      persistBrowseRailWidth(storageKey, next);
      return next;
    });
  }, [storageKey]);

  useEffect(
    () => () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      clearPanelResizeCursor();
    },
    [onPointerMove, onPointerUp]
  );

  return { width, setWidth, onHandlePointerDown, nudgeWidth };
};
