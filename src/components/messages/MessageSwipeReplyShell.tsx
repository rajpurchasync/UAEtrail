import { type ReactNode, useRef, useState } from 'react';
import { CornerDownRight } from 'lucide-react';

const SWIPE_REPLY_THRESHOLD_PX = 52;
const SWIPE_MAX_PX = 76;
const SWIPE_LOCK_PX = 8;
const LONG_PRESS_MS = 450;
const LONG_PRESS_CANCEL_PX = 10;

type MessageSwipeReplyShellProps = {
  enabled: boolean;
  onReply: () => void;
  /** Opens unified reply/reaction menu anchored on the message. */
  onLongPress?: (anchor: DOMRect) => void;
  children: ReactNode;
  className?: string;
};

/**
 * Mobile: swipe right to reply; long-press for action sheet.
 * Desktop: hover actions on the bubble — no swipe.
 */
export const MessageSwipeReplyShell = ({
  enabled,
  onReply,
  onLongPress,
  children,
  className = '',
}: MessageSwipeReplyShellProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [offsetX, setOffsetX] = useState(0);
  const offsetXRef = useRef(0);
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);
  const swipingRef = useRef(false);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);

  const clearLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const resetSwipe = () => {
    touchOriginRef.current = null;
    swipingRef.current = false;
    offsetXRef.current = 0;
    setOffsetX(0);
    clearLongPress();
    longPressFiredRef.current = false;
  };

  const setSwipeOffset = (value: number) => {
    offsetXRef.current = value;
    setOffsetX(value);
  };

  const onTouchStart = (event: React.TouchEvent) => {
    if (!enabled) return;
    const touch = event.touches[0];
    touchOriginRef.current = { x: touch.clientX, y: touch.clientY };
    swipingRef.current = false;
    longPressFiredRef.current = false;
    clearLongPress();

    if (onLongPress) {
      longPressTimerRef.current = window.setTimeout(() => {
        longPressFiredRef.current = true;
        const rect = contentRef.current?.getBoundingClientRect();
        if (rect) onLongPress(rect);
      }, LONG_PRESS_MS);
    }
  };

  const onTouchMove = (event: React.TouchEvent) => {
    if (!enabled || !touchOriginRef.current) return;
    const touch = event.touches[0];
    const dx = touch.clientX - touchOriginRef.current.x;
    const dy = touch.clientY - touchOriginRef.current.y;

    if (Math.abs(dx) > LONG_PRESS_CANCEL_PX || Math.abs(dy) > LONG_PRESS_CANCEL_PX) {
      clearLongPress();
    }

    if (!swipingRef.current) {
      if (Math.abs(dx) < SWIPE_LOCK_PX && Math.abs(dy) < SWIPE_LOCK_PX) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        resetSwipe();
        return;
      }
      swipingRef.current = true;
    }

    if (dx < 0) {
      setSwipeOffset(0);
      return;
    }

    setSwipeOffset(Math.min(dx, SWIPE_MAX_PX));
  };

  const onTouchEnd = () => {
    if (!enabled) {
      resetSwipe();
      return;
    }
    if (!longPressFiredRef.current && offsetXRef.current >= SWIPE_REPLY_THRESHOLD_PX) {
      onReply();
    }
    resetSwipe();
  };

  const replyIconOpacity = Math.min(1, offsetX / SWIPE_REPLY_THRESHOLD_PX);

  return (
    <div className={`relative md:touch-pan-y ${className}`.trim()}>
      {enabled ? (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 flex w-14 items-center justify-center md:hidden"
          aria-hidden
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition-opacity"
            style={{ opacity: replyIconOpacity }}
          >
            <CornerDownRight className="h-5 w-5" />
          </span>
        </div>
      ) : null}
      <div
        ref={contentRef}
        className="relative w-fit transition-transform duration-75 ease-out md:!translate-x-0"
        style={{ transform: offsetX > 0 ? `translateX(${offsetX}px)` : undefined }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};
