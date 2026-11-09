import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { applyPanelResizeCursor, clearPanelResizeCursor } from '../../config/panelResizeCursor';

const STORAGE_KEY = 'uaetrail:explore-list-drawer-width';
const COLLAPSED_KEY = 'uaetrail:explore-list-drawer-collapsed';
/** Two thumbnail cards at their minimum size, plus the list padding and gap. */
const MIN_WIDTH = 360;
/** Two thumbnail cards at their maximum size — a third column starts once the panel is wider. */
const DEFAULT_WIDTH = 450;
/** Collapsed rail — filter chips + reopen control (keep map maximized). */
const COLLAPSED_WIDTH = 168;
const MAP_SLIVER = 280;

const maxDrawerWidth = () =>
  typeof window === 'undefined' ? 720 : Math.max(MIN_WIDTH, window.innerWidth - MAP_SLIVER);

const readStoredWidth = (): number => {
  if (typeof window === 'undefined') return DEFAULT_WIDTH;
  const raw = Number.parseInt(window.localStorage.getItem(STORAGE_KEY) ?? '', 10);
  if (!Number.isFinite(raw)) return DEFAULT_WIDTH;
  return Math.min(Math.max(raw, MIN_WIDTH), maxDrawerWidth());
};

const clampWidth = (width: number) => Math.min(Math.max(width, MIN_WIDTH), maxDrawerWidth());

type DrawerChrome = {
  maximized: boolean;
  toggleMaximized: () => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
};

const ExploreDesktopListDrawerContext = createContext<DrawerChrome | null>(null);

export const useExploreDesktopListDrawerChrome = (): DrawerChrome | null =>
  useContext(ExploreDesktopListDrawerContext);

type ExploreDesktopListDrawerProps = {
  children: ReactNode;
  onClose: () => void;
};

const readCollapsed = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(COLLAPSED_KEY) === '1';
};

/** Full-height desktop browse list on the left of the map. Drag the right edge to resize; collapse keeps applied filters visible. */
export const ExploreDesktopListDrawer = ({ children, onClose }: ExploreDesktopListDrawerProps) => {
  const [width, setWidth] = useState(readStoredWidth);
  const [maximized, setMaximized] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const onResize = () => setWidth((current) => clampWidth(current));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [collapsed, maximized]);

  const onPointerMove = useCallback((event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    setWidth(clampWidth(drag.startWidth + (event.clientX - drag.startX)));
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    clearPanelResizeCursor();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    setWidth((current) => {
      window.localStorage.setItem(STORAGE_KEY, String(current));
      return current;
    });
    window.dispatchEvent(new Event('resize'));
  }, [onPointerMove]);

  const onHandlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (maximized || collapsed) return;
    event.preventDefault();
    dragRef.current = { startX: event.clientX, startWidth: width };
    applyPanelResizeCursor();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  useEffect(
    () => () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      clearPanelResizeCursor();
    },
    [onPointerMove, onPointerUp]
  );

  const toggleMaximized = useCallback(() => setMaximized((current) => !current), []);
  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      if (next) setMaximized(false);
      try {
        window.localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        /* ignore quota */
      }
      return next;
    });
  }, []);

  const panelWidth = collapsed ? COLLAPSED_WIDTH : width;

  return (
    <ExploreDesktopListDrawerContext.Provider
      value={{ maximized, toggleMaximized, collapsed, toggleCollapsed }}
    >
      <aside
        className={`pointer-events-auto relative flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-neutral-200 bg-neutral-50 shadow-[16px_0_40px_rgba(15,23,42,0.12)] ${
          maximized ? 'absolute inset-0 z-30 w-full max-w-none' : 'max-w-full'
        }`}
        style={maximized ? undefined : { width: panelWidth }}
        aria-label="List and browse"
      >
        <button type="button" className="sr-only" onClick={onClose}>
          Close list
        </button>
        {children}
        {maximized || collapsed ? null : (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize browse panel"
            onPointerDown={onHandlePointerDown}
            className="absolute inset-y-0 right-0 z-20 w-2 cursor-ew-resize touch-none hover:bg-emerald-500/25"
          />
        )}
      </aside>
    </ExploreDesktopListDrawerContext.Provider>
  );
};
