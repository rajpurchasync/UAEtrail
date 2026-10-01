import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';

const VIEWPORT_PADDING = 12;

type UseExploreMapPillDropdownArgs = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  minWidthPx?: number;
  zIndex?: number;
  /** Full-width panel below anchor (map search). */
  layout?: 'minWidth' | 'fullWidth';
  /** Top edge for dropdown — defaults to `anchorRef` bottom. */
  positionBelowRef?: RefObject<HTMLElement | null>;
};

/** Fixed-position menu for map filter pills (escapes horizontal scroll clipping). */
export const useExploreMapPillDropdown = ({
  open,
  onOpenChange,
  minWidthPx = 184,
  zIndex = 3200,
  layout = 'minWidth',
  positionBelowRef,
}: UseExploreMapPillDropdownArgs) => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const updatePosition = () => {
    const positionEl = positionBelowRef?.current ?? anchorRef.current;
    if (!positionEl) return;
    const rect = positionEl.getBoundingClientRect();
    const gap = 8;

    if (layout === 'fullWidth') {
      const width = Math.min(352, window.innerWidth - VIEWPORT_PADDING * 2);
      const left = Math.max(VIEWPORT_PADDING, (window.innerWidth - width) / 2);
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + gap,
        left,
        width,
        zIndex,
      });
      return;
    }

    const left = Math.max(
      VIEWPORT_PADDING,
      Math.min(rect.left, window.innerWidth - minWidthPx - VIEWPORT_PADDING)
    );
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + gap,
      left,
      minWidth: minWidthPx,
      zIndex,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, minWidthPx, zIndex, layout, positionBelowRef]);

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
    const onLayout = () => updatePosition();
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onLayout);
    window.addEventListener('scroll', onLayout, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onLayout);
      window.removeEventListener('scroll', onLayout, true);
    };
  }, [open, onOpenChange, minWidthPx, zIndex]);

  return { anchorRef, menuRef, menuStyle };
};

export type ExploreMapPillDropdownRefs = {
  anchorRef: RefObject<HTMLDivElement>;
  menuRef: RefObject<HTMLDivElement>;
  menuStyle: CSSProperties;
};
