import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';

const DISMISS_THRESHOLD_PX = 56;
const EXPAND_THRESHOLD_PX = 44;
const EXPAND_DRAG_CAP_PX = 140;
const COMPOSE_DISMISS_DRAG_CAP_PX = 280;
const COMPOSE_EXPAND_PULL_CAP_PX = 52;
const EXIT_ANIMATION_MS = 300;
const SNAP_ANIMATION_MS = 280;

const SHEET_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

export const SHEET_DRAG_HANDLE_ATTR = 'data-sheet-drag-handle';

type SheetDragMode = 'default' | 'peek';

type UseSheetDragDismissOptions = {
  enabled?: boolean;
  /** Pull up past threshold (when handle drag allows negative offset). */
  onExpand?: () => void;
  /** Peek bottom sheets — pull down close / pull up expand (browse). */
  mode?: SheetDragMode;
};

type DragZoneProps = {
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerUp: (event: React.PointerEvent) => void;
  onPointerCancel: (event: React.PointerEvent) => void;
};

type UseSheetDragDismissResult = {
  panelRef: RefObject<HTMLDivElement | null>;
  panelStyle: CSSProperties;
  overlayStyle: CSSProperties;
  isDragging: boolean;
  /** Spread on the full-width drag zone (handle + hint). */
  dragZoneProps: DragZoneProps;
};

const GESTURE_AXIS_LOCK_PX = 10;

/** Pull down on the drag zone to dismiss; optional pull up to expand. */
export const useSheetDragDismiss = (
  onClose: () => void | boolean,
  options?: UseSheetDragDismissOptions
): UseSheetDragDismissResult => {
  const enabled = options?.enabled ?? true;
  const mode = options?.mode ?? 'default';
  const peek = mode === 'peek';
  const onCloseRef = useRef(onClose);
  const onExpandRef = useRef(options?.onExpand);
  onCloseRef.current = onClose;
  onExpandRef.current = options?.onExpand;

  const panelRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);
  const [snapBack, setSnapBack] = useState(false);
  const [exiting, setExiting] = useState(false);
  const startYRef = useRef(0);
  const activeRef = useRef(false);
  const translateRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const peekGestureLockRef = useRef<'dismiss' | 'expand' | null>(null);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current != null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const resetTransform = useCallback(
    (animate: boolean) => {
      clearExitTimer();
      setExiting(false);
      if (animate) setSnapBack(true);
      setTranslateY(0);
      translateRef.current = 0;
      if (animate) window.setTimeout(() => setSnapBack(false), SNAP_ANIMATION_MS);
    },
    [clearExitTimer]
  );

  const finishDrag = useCallback(() => {
    if (!activeRef.current || exiting) return;
    activeRef.current = false;
    pointerIdRef.current = null;
    const dy = translateRef.current;
    const onExpand = onExpandRef.current;

    if (dy >= DISMISS_THRESHOLD_PX) {
      if (peek && peekGestureLockRef.current === 'expand') {
        resetTransform(true);
        peekGestureLockRef.current = null;
        return;
      }
      const closed = onCloseRef.current();
      if (closed === false) {
        resetTransform(true);
      } else if (!peek) {
        resetTransform(false);
      }
      peekGestureLockRef.current = null;
      // Peek: keep drag offset until parent unmounts — snapping to 0 flashes the white sheet.
      return;
    }
    if (onExpand && dy <= -EXPAND_THRESHOLD_PX) {
      if (peek && peekGestureLockRef.current === 'dismiss') {
        resetTransform(true);
        peekGestureLockRef.current = null;
        return;
      }
      resetTransform(true);
      window.requestAnimationFrame(() => {
        onExpand();
      });
      peekGestureLockRef.current = null;
      return;
    }
    resetTransform(true);
    peekGestureLockRef.current = null;
  }, [exiting, peek, resetTransform]);

  const applyDragDelta = useCallback(
    (clientY: number) => {
      const dy = clientY - startYRef.current;
      const onExpand = onExpandRef.current;
      let next: number;

      if (peek) {
        if (peekGestureLockRef.current === null && Math.abs(dy) >= GESTURE_AXIS_LOCK_PX) {
          peekGestureLockRef.current = dy > 0 ? 'dismiss' : 'expand';
        }
        const lock = peekGestureLockRef.current;
        if (lock === 'dismiss') {
          next = Math.min(Math.max(0, dy), COMPOSE_DISMISS_DRAG_CAP_PX);
        } else if (lock === 'expand' && onExpand) {
          next = dy > 0 ? 0 : Math.max(dy * 0.55, -COMPOSE_EXPAND_PULL_CAP_PX);
        } else if (dy > 0) {
          next = Math.min(dy, COMPOSE_DISMISS_DRAG_CAP_PX);
        } else if (onExpand) {
          next = Math.max(dy * 0.55, -COMPOSE_EXPAND_PULL_CAP_PX);
        } else {
          next = Math.min(0, dy);
        }
      } else if (!onExpand) {
        next = Math.max(0, dy);
      } else {
        next = Math.min(EXPAND_DRAG_CAP_PX, Math.max(-EXPAND_DRAG_CAP_PX, dy));
      }

      translateRef.current = next;
      setTranslateY(next);
      return next;
    },
    [peek]
  );

  const beginDrag = useCallback(
    (clientY: number, pointerId: number) => {
      if (!enabled || exiting) return;
      activeRef.current = true;
      pointerIdRef.current = pointerId;
      setSnapBack(false);
      startYRef.current = clientY;
      translateRef.current = 0;
      setTranslateY(0);
      peekGestureLockRef.current = null;
    },
    [enabled, exiting]
  );

  const onDragZonePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (event.button !== 0) return;
      beginDrag(event.clientY, event.pointerId);
      const captureTarget = panelRef.current ?? event.currentTarget;
      captureTarget.setPointerCapture(event.pointerId);
    },
    [beginDrag]
  );

  const onDragZonePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!activeRef.current || pointerIdRef.current !== event.pointerId) return;
      const next = applyDragDelta(event.clientY);
      if (Math.abs(next) > 6) event.preventDefault();
    },
    [applyDragDelta]
  );

  const onDragZonePointerEnd = useCallback(
    (event: React.PointerEvent) => {
      if (pointerIdRef.current !== event.pointerId) return;
      const captureTarget = panelRef.current ?? event.currentTarget;
      if (captureTarget.hasPointerCapture(event.pointerId)) {
        captureTarget.releasePointerCapture(event.pointerId);
      }
      finishDrag();
    },
    [finishDrag]
  );

  useEffect(() => {
    if (!enabled) {
      resetTransform(false);
      return;
    }

    const onMove = (event: PointerEvent) => {
      if (!activeRef.current || pointerIdRef.current !== event.pointerId) return;
      const next = applyDragDelta(event.clientY);
      if (Math.abs(next) > 6) event.preventDefault();
    };

    const onEnd = (event: PointerEvent) => {
      if (!activeRef.current || pointerIdRef.current !== event.pointerId) return;
      const captureTarget = panelRef.current;
      if (captureTarget?.hasPointerCapture(event.pointerId)) {
        captureTarget.releasePointerCapture(event.pointerId);
      }
      finishDrag();
    };

    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onEnd);
    document.addEventListener('pointercancel', onEnd);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onEnd);
      document.removeEventListener('pointercancel', onEnd);
      clearExitTimer();
    };
  }, [enabled, applyDragDelta, finishDrag, clearExitTimer, resetTransform]);

  const isDragging = translateY !== 0 && !exiting;
  const panelStyle: CSSProperties = enabled
    ? {
        transform: translateY !== 0 ? `translate3d(0, ${translateY}px, 0)` : undefined,
        transition:
          snapBack || exiting ? `transform ${EXIT_ANIMATION_MS}ms ${SHEET_EASE}` : undefined,
        willChange: isDragging ? 'transform' : undefined,
      }
    : {};

  const overlayStyle: CSSProperties =
    peek && (translateY > 0 || exiting)
      ? {
          opacity: exiting
            ? 0
            : Math.max(0, 1 - translateY / (COMPOSE_DISMISS_DRAG_CAP_PX * 1.35)),
          transition: snapBack || exiting ? `opacity ${EXIT_ANIMATION_MS}ms ${SHEET_EASE}` : undefined,
          pointerEvents: exiting ? 'none' : undefined,
        }
      : {};

  return {
    panelRef,
    panelStyle,
    overlayStyle,
    isDragging,
    dragZoneProps: {
      onPointerDown: onDragZonePointerDown,
      onPointerMove: onDragZonePointerMove,
      onPointerUp: onDragZonePointerEnd,
      onPointerCancel: onDragZonePointerEnd,
    },
  };
};
