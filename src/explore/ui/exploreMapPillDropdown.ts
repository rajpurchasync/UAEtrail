import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';

const VIEWPORT_PADDING = 12;
const FULL_WIDTH_MAX = 352;

/** iOS Safari zooms focused inputs below 16px — use explicit px in map overlays. */
export const EXPLORE_MAP_SEARCH_INPUT_FONT_PX = 16;

type VisualViewportBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const readVisualViewport = (): VisualViewportBox => {
  const vv = window.visualViewport;
  if (!vv) {
    return {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  return {
    left: vv.offsetLeft,
    top: vv.offsetTop,
    width: vv.width,
    height: vv.height,
  };
};

const styleSignature = (style: CSSProperties): string =>
  JSON.stringify({
    top: style.top,
    left: style.left,
    width: style.width,
    maxWidth: style.maxWidth,
    maxHeight: style.maxHeight,
    minWidth: style.minWidth,
  });

type UseExploreMapPillDropdownArgs = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  minWidthPx?: number;
  zIndex?: number;
  /** Full-width panel below anchor (map search). */
  layout?: 'minWidth' | 'fullWidth';
  /** Top edge for dropdown — defaults to `anchorRef` bottom. */
  positionBelowRef?: RefObject<HTMLElement | null>;
  /** Re-run layout when content changes (e.g. search hints) — not on every pixel resize. */
  repositionDeps?: ReadonlyArray<unknown>;
};

/** Fixed-position menu for map filter pills (escapes horizontal scroll clipping). */
export const useExploreMapPillDropdown = ({
  open,
  onOpenChange,
  minWidthPx = 184,
  zIndex = 3200,
  layout = 'minWidth',
  positionBelowRef,
  repositionDeps = [],
}: UseExploreMapPillDropdownArgs) => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const lastStyleKeyRef = useRef('');
  const rafRef = useRef(0);

  const applyPosition = useCallback(() => {
    const positionEl = positionBelowRef?.current ?? anchorRef.current;
    if (!positionEl) return;
    const rect = positionEl.getBoundingClientRect();
    const gap = 8;
    const viewport = readVisualViewport();

    let next: CSSProperties;

    if (layout === 'fullWidth') {
      const width = Math.min(FULL_WIDTH_MAX, viewport.width - VIEWPORT_PADDING * 2);
      const left =
        viewport.left + Math.max(VIEWPORT_PADDING, (viewport.width - width) / 2);
      const top = rect.bottom + gap;
      const maxHeight = Math.max(
        160,
        viewport.top + viewport.height - top - VIEWPORT_PADDING
      );

      next = {
        position: 'fixed',
        top,
        left,
        width,
        maxWidth: width,
        maxHeight,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        zIndex,
      };
    } else {
      const left = Math.max(
        viewport.left + VIEWPORT_PADDING,
        Math.min(
          rect.left,
          viewport.left + viewport.width - minWidthPx - VIEWPORT_PADDING
        )
      );
      next = {
        position: 'fixed',
        top: rect.bottom + gap,
        left,
        minWidth: minWidthPx,
        zIndex,
      };
    }

    const key = styleSignature(next);
    if (key === lastStyleKeyRef.current) return;
    lastStyleKeyRef.current = key;
    setMenuStyle(next);
  }, [layout, minWidthPx, positionBelowRef, zIndex]);

  const schedulePosition = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      applyPosition();
    });
  }, [applyPosition]);

  useLayoutEffect(() => {
    if (!open) {
      lastStyleKeyRef.current = '';
      return;
    }
    schedulePosition();
  }, [open, schedulePosition, ...repositionDeps]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      onOpenChange(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };

    const onViewportResize = () => schedulePosition();

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onViewportResize);
    window.visualViewport?.addEventListener('resize', onViewportResize);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onViewportResize);
      window.visualViewport?.removeEventListener('resize', onViewportResize);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [open, onOpenChange, schedulePosition]);

  return { anchorRef, menuRef, menuStyle, updatePosition: schedulePosition };
};

export type ExploreMapPillDropdownRefs = {
  anchorRef: RefObject<HTMLDivElement>;
  menuRef: RefObject<HTMLDivElement>;
  menuStyle: CSSProperties;
};
