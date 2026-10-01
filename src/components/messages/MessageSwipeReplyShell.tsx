import { type ReactNode, useRef, useState } from 'react';
import { CornerDownRight } from 'lucide-react';

const SWIPE_REPLY_THRESHOLD_PX = 52;
const SWIPE_MAX_PX = 76;
const SWIPE_LOCK_PX = 8;

type MessageSwipeReplyShellProps = {
  enabled: boolean;
  onReply: () => void;
  children: ReactNode;
  className?: string;
};

/** Mobile: swipe right to reply (Android-style). Desktop: no swipe — use hover actions. */
export const MessageSwipeReplyShell = ({
  enabled,
  onReply,
  children,
  className = '',
}: MessageSwipeReplyShellProps) => {
  const [offsetX, setOffsetX] = useState(0);
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);
  const swipingRef = useRef(false);

  const resetSwipe = () => {
    touchOriginRef.current = null;
    swipingRef.current = false;
    setOffsetX(0);
  };

  const onTouchStart = (event: React.TouchEvent) => {
    if (!enabled) return;
    const touch = event.touches[0];
    touchOriginRef.current = { x: touch.clientX, y: touch.clientY };
    swipingRef.current = false;
  };

  const onTouchMove = (event: React.TouchEvent) => {
    if (!enabled || !touchOriginRef.current) return;
    const touch = event.touches[0];
    const dx = touch.clientX - touchOriginRef.current.x;
    const dy = touch.clientY - touchOriginRef.current.y;

    if (!swipingRef.current) {
      if (Math.abs(dx) < SWIPE_LOCK_PX && Math.abs(dy) < SWIPE_LOCK_PX) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        resetSwipe();
        return;
      }
      swipingRef.current = true;
    }

    if (dx < 0) {
      setOffsetX(0);
      return;
    }

    setOffsetX(Math.min(dx, SWIPE_MAX_PX));
  };

  const onTouchEnd = () => {
    if (!enabled) {
      resetSwipe();
      return;
    }
    if (offsetX >= SWIPE_REPLY_THRESHOLD_PX) {
      onReply();
    }
    resetSwipe();
  };

  const replyIconOpacity = Math.min(1, offsetX / SWIPE_REPLY_THRESHOLD_PX);

  return (
    <div className={`relative min-w-0 max-w-full md:touch-pan-y ${className}`.trim()}>
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
        className="relative transition-transform duration-75 ease-out md:!translate-x-0"
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
