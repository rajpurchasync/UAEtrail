import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  delayMs?: number;
}

/** Detect long-press vs tap on touch and mouse. */
export function useLongPress({ onLongPress, onClick, delayMs = 500 }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    longPressTriggered.current = false;
    clear();
    timerRef.current = setTimeout(() => {
      longPressTriggered.current = true;
      onLongPress();
    }, delayMs);
  }, [clear, delayMs, onLongPress]);

  const end = useCallback(() => {
    clear();
    if (!longPressTriggered.current) {
      onClick?.();
    }
  }, [clear, onClick]);

  const cancel = useCallback(() => {
    clear();
    longPressTriggered.current = false;
  }, [clear]);

  return {
    onTouchStart: start,
    onTouchEnd: end,
    onTouchCancel: cancel,
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: cancel,
  };
}
