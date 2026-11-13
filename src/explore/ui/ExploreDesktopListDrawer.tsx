import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { ExploreDesktopBrowseRailShell } from './ExploreDesktopBrowseRailShell';
import { EXPLORE_DESKTOP_BROWSE_RAIL_CONTENT_CLASS } from './exploreDesktopBrowseRailChrome';
import { maxExploreBrowseRailWidth } from './exploreDesktopBrowseRailWidth';
import { useExploreDesktopBrowseRailWidth } from './useExploreDesktopBrowseRailWidth';

const STORAGE_KEY = 'uaetrail:explore-list-drawer-width';
const COLLAPSED_KEY = 'uaetrail:explore-list-drawer-collapsed';
/** Collapsed rail — filter chips + reopen control (keep map maximized). */
const COLLAPSED_WIDTH = 168;

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
  const [maximized, setMaximized] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const { width, onHandlePointerDown, nudgeWidth } = useExploreDesktopBrowseRailWidth({
    storageKey: STORAGE_KEY,
    resizable: !maximized && !collapsed,
    notifyMapLayout: false,
  });

  const onHandleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 32 : 16;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nudgeWidth(step);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      nudgeWidth(-step);
    }
  };

  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [collapsed, maximized, width]);

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
  const maxWidth = maxExploreBrowseRailWidth();
  const showResizeHandle = !maximized && !collapsed;

  return (
    <ExploreDesktopListDrawerContext.Provider
      value={{ maximized, toggleMaximized, collapsed, toggleCollapsed }}
    >
      {maximized ? (
        <aside
          className="pointer-events-auto absolute inset-0 z-30 flex h-full min-h-0 w-full max-w-none flex-col overflow-hidden border-r border-neutral-200 bg-white shadow-[16px_0_40px_rgba(15,23,42,0.12)] dark:border-neutral-800 dark:bg-neutral-950"
          aria-label="List and browse"
        >
          <button type="button" className="sr-only" onClick={onClose}>
            Close list
          </button>
          <div className={EXPLORE_DESKTOP_BROWSE_RAIL_CONTENT_CLASS}>{children}</div>
        </aside>
      ) : (
        <ExploreDesktopBrowseRailShell
          width={panelWidth}
          maxWidth={maxWidth}
          ariaLabel="List and browse"
          showResizeHandle={showResizeHandle}
          resize={{
            width: panelWidth,
            maxWidth,
            ariaLabel: 'Resize browse panel',
            onPointerDown: onHandlePointerDown,
            onKeyDown: onHandleKeyDown,
          }}
        >
          <button type="button" className="sr-only" onClick={onClose}>
            Close list
          </button>
          {children}
        </ExploreDesktopBrowseRailShell>
      )}
    </ExploreDesktopListDrawerContext.Provider>
  );
};
