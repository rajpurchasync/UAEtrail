import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'uaetrail:explore-list-drawer-width';
/** Two thumbnail cards at their minimum size, plus the list padding and gap. */
const MIN_WIDTH = 360;
/** Two thumbnail cards at their maximum size — a third column starts once the panel is wider. */
const DEFAULT_WIDTH = 450;
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
};

const ExploreDesktopListDrawerContext = createContext<DrawerChrome | null>(null);

export const useExploreDesktopListDrawerChrome = (): DrawerChrome | null =>
  useContext(ExploreDesktopListDrawerContext);

type ExploreDesktopListDrawerProps = {
  children: ReactNode;
  onClose: () => void;
};

/** Full-height desktop list on the left of the map. Drag the right edge to resize. */
export const ExploreDesktopListDrawer = ({ children, onClose }: ExploreDesktopListDrawerProps) => {
  const [width, setWidth] = useState(readStoredWidth);
  const [maximized, setMaximized] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const onResize = () => setWidth((current) => clampWidth(current));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onPointerMove = useCallback((event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    setWidth(clampWidth(drag.startWidth + (event.clientX - drag.startX)));
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    document.body.style.removeProperty('cursor');
    document.body.style.removeProperty('user-select');
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    setWidth((current) => {
      window.localStorage.setItem(STORAGE_KEY, String(current));
      return current;
    });
  }, [onPointerMove]);

  const onHandlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (maximized) return;
    event.preventDefault();
    dragRef.current = { startX: event.clientX, startWidth: width };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  useEffect(
    () => () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    },
    [onPointerMove, onPointerUp]
  );

  const toggleMaximized = useCallback(() => setMaximized((current) => !current), []);

  return (
    <ExploreDesktopListDrawerContext.Provider value={{ maximized, toggleMaximized }}>
      <aside
        className={`pointer-events-auto relative flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-neutral-200 bg-neutral-50 shadow-[16px_0_40px_rgba(15,23,42,0.12)] ${
          maximized ? 'absolute inset-0 z-30 w-full max-w-none' : 'max-w-full'
        }`}
        style={maximized ? undefined : { width }}
        aria-label="List and browse"
      >
        <button type="button" className="sr-only" onClick={onClose}>
          Close list
        </button>
        {children}
        {maximized ? null : (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize list panel"
            onPointerDown={onHandlePointerDown}
            className="absolute inset-y-0 right-0 z-20 w-2 cursor-col-resize touch-none hover:bg-emerald-500/25"
          />
        )}
      </aside>
    </ExploreDesktopListDrawerContext.Provider>
  );
};
