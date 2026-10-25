import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';

const DISMISS_THRESHOLD_PX = 72;
const EXPAND_THRESHOLD_PX = 56;
const EXPAND_DRAG_CAP_PX = 120;

export const SHEET_DRAG_HANDLE_ATTR = 'data-sheet-drag-handle';

type UseSheetDragDismissOptions = {
  enabled?: boolean;
  /** Pull up past threshold (when handle drag allows negative offset). */
  onExpand?: () => void;
};

type DragZoneProps = {
  onTouchStart: (event: React.TouchEvent) => void;
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerUp: (event: React.PointerEvent) => void;
  onPointerCancel: (event: React.PointerEvent) => void;
};

type UseSheetDragDismissResult = {
  panelRef: RefObject<HTMLDivElement | null>;
  panelStyle: CSSProperties;
  /** Spread on the full-width drag zone (handle + hint). */
  dragZoneProps: DragZoneProps;
};

/** Pull down on the drag zone to dismiss; optional pull up to expand. */
export const useSheetDragDismiss = (
  onClose: () => void,
  options?: UseSheetDragDismissOptions
): UseSheetDragDismissResult => {
  const enabled = options?.enabled ?? true;
  const onExpand = options?.onExpand;
  const panelRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);
  const [snapBack, setSnapBack] = useState(false);
  const startYRef = useRef(0);
  const activeRef = useRef(false);
  const translateRef = useRef(0);

  const resetTransform = useCallback((animate: boolean) => {
    if (animate) setSnapBack(true);
    setTranslateY(0);
    translateRef.current = 0;
    if (animate) window.setTimeout(() => setSnapBack(false), 220);
  }, []);

  const finishDrag = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    const dy = translateRef.current;
    if (dy >= DISMISS_THRESHOLD_PX) {
      resetTransform(false);
      onClose();
      return;
    }
    if (dy <= -EXPAND_THRESHOLD_PX && onExpand) {
      resetTransform(false);
      onExpand();
      return;
    }
    resetTransform(true);
  }, [onClose, onExpand, resetTransform]);

  const applyDragDelta = useCallback(
    (clientY: number) => {
      const dy = clientY - startYRef.current;
      const next = !onExpand
        ? Math.max(0, dy)
        : Math.min(EXPAND_DRAG_CAP_PX, Math.max(-EXPAND_DRAG_CAP_PX, dy));
      translateRef.current = next;
      setTranslateY(next);
      return next;
    },
    [onExpand]
  );

  const beginDrag = useCallback(
    (clientY: number) => {
      if (!enabled) return;
      activeRef.current = true;
      setSnapBack(false);
      startYRef.current = clientY;
    },
    [enabled]
  );

  const onDragZoneTouchStart = useCallback(
    (event: React.TouchEvent) => {
      beginDrag(event.touches[0]?.clientY ?? 0);
    },
    [beginDrag]
  );

  const onDragZonePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (event.button !== 0) return;
      beginDrag(event.clientY);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [beginDrag]
  );

  const onDragZonePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!activeRef.current) return;
      const next = applyDragDelta(event.clientY);
      if (Math.abs(next) > 6) event.preventDefault();
    },
    [applyDragDelta]
  );

  const onDragZonePointerEnd = useCallback(
    (event: React.PointerEvent) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      finishDrag();
    },
    [finishDrag]
  );

  useEffect(() => {
    if (!enabled) return;

    const onMove = (event: TouchEvent) => {
      if (!activeRef.current) return;
      const y = event.touches[0]?.clientY ?? 0;
      const next = applyDragDelta(y);
      if (Math.abs(next) > 6) event.preventDefault();
    };

    const onEnd = () => finishDrag();

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [enabled, applyDragDelta, finishDrag]);

  const panelStyle: CSSProperties = {
    transform: translateY !== 0 ? `translateY(${translateY}px)` : undefined,
    transition: snapBack ? 'transform 0.2s ease-out' : undefined,
  };

  return {
    panelRef,
    panelStyle,
    dragZoneProps: {
      onTouchStart: onDragZoneTouchStart,
      onPointerDown: onDragZonePointerDown,
      onPointerMove: onDragZonePointerMove,
      onPointerUp: onDragZonePointerEnd,
      onPointerCancel: onDragZonePointerEnd,
    },
  };
};
