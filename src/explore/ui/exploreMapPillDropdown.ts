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
const CARET_INSET = 16;
const ANCHOR_GAP = 12;

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
  /** Leaves overflow visible so a caret can sit on the top edge. */
  showCaret?: boolean;
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
  showCaret = false,
}: UseExploreMapPillDropdownArgs) => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const [caretLeftPx, setCaretLeftPx] = useState(CARET_INSET);
  const lastCaretRef = useRef(CARET_INSET);
  const lastStyleKeyRef = useRef('');
  const rafRef = useRef(0);
  const repositionKey = JSON.stringify(repositionDeps);

  const applyPosition = useCallback(() => {
    const positionEl = positionBelowRef?.current ?? anchorRef.current;
    if (!positionEl) return;
    const rect = positionEl.getBoundingClientRect();
    const viewport = readVisualViewport();
    const minLeft = viewport.left + VIEWPORT_PADDING;
    const maxRight = viewport.left + viewport.width - VIEWPORT_PADDING;
    const maxWidth = Math.max(120, maxRight - minLeft);
    const anchorCenter = rect.left + rect.width / 2;

    const clampLeft = (left: number, width: number) =>
      Math.min(Math.max(left, minLeft), Math.max(minLeft, maxRight - width));

    const caretFor = (left: number, width: number) =>
      Math.min(width - CARET_INSET, Math.max(CARET_INSET, anchorCenter - left));

    let next: CSSProperties;
    let caret: number;

    if (layout === 'fullWidth') {
      const width = Math.min(FULL_WIDTH_MAX, maxWidth);
      const top = rect.bottom + ANCHOR_GAP;
      const maxHeight = Math.max(160, viewport.top + viewport.height - top - VIEWPORT_PADDING);
      const left = clampLeft(
        viewport.left + Math.max(VIEWPORT_PADDING, (viewport.width - width) / 2),
        width
      );
      caret = caretFor(left, width);
      next = {
        position: 'fixed',
        top,
        left,
        width,
        maxWidth: width,
        maxHeight,
        zIndex,
        ...(showCaret
          ? {}
          : { overflowY: 'auto', WebkitOverflowScrolling: 'touch' }),
      };
    } else {
      const measured = menuRef.current?.offsetWidth ?? 0;
      const width = Math.min(Math.max(minWidthPx, measured), maxWidth);
      const top = rect.bottom + ANCHOR_GAP;
      const left = clampLeft(anchorCenter - width / 2, width);
      caret = caretFor(left, width);
      const maxHeight = Math.max(160, viewport.top + viewport.height - top - VIEWPORT_PADDING);
      next = {
        position: 'fixed',
        top,
        left,
        width,
        maxWidth: width,
        maxHeight,
        zIndex,
        ...(showCaret
          ? {}
          : { overflowY: 'auto', WebkitOverflowScrolling: 'touch' }),
      };
    }

    const roundedCaret = Math.round(caret);
    if (roundedCaret !== lastCaretRef.current) {
      lastCaretRef.current = roundedCaret;
      setCaretLeftPx(roundedCaret);
    }
    const key = styleSignature(next);
    if (key === lastStyleKeyRef.current) return;
    lastStyleKeyRef.current = key;
    setMenuStyle(next);
  }, [layout, minWidthPx, positionBelowRef, showCaret, zIndex]);

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
  }, [open, schedulePosition, repositionKey]);

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

  return { anchorRef, menuRef, menuStyle, caretLeftPx, updatePosition: schedulePosition };
};

export type ExploreMapPillDropdownRefs = {
  anchorRef: RefObject<HTMLDivElement>;
  menuRef: RefObject<HTMLDivElement>;
  menuStyle: CSSProperties;
};
