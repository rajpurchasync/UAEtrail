import { ReactNode, useCallback, useRef, useState } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  disabled?: boolean;
}

const THRESHOLD = 72;

/** Touch pull-to-refresh when scrolled to top (mobile hub pages). */
export const PullToRefresh = ({ onRefresh, children, disabled = false }: PullToRefreshProps) => {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const dragging = useRef(false);

  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (disabled || refreshing || window.scrollY > 4) return;
      startY.current = event.touches[0]?.clientY ?? 0;
      dragging.current = true;
    },
    [disabled, refreshing]
  );

  const onTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!dragging.current || disabled || refreshing) return;
      const currentY = event.touches[0]?.clientY ?? 0;
      const delta = currentY - startY.current;
      if (delta > 0 && window.scrollY <= 4) {
        setPull(Math.min(delta * 0.45, THRESHOLD + 16));
      } else if (delta <= 0) {
        setPull(0);
      }
    },
    [disabled, refreshing]
  );

  const onTouchEnd = useCallback(async () => {
    if (!dragging.current) return;
    dragging.current = false;

    if (pull >= THRESHOLD && !refreshing && !disabled) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
      return;
    }

    setPull(0);
  }, [disabled, onRefresh, pull, refreshing]);

  const showIndicator = pull > 8 || refreshing;

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={() => void onTouchEnd()}>
      <div
        className={`flex items-end justify-center overflow-hidden transition-[height] duration-200 ${
          showIndicator ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ height: showIndicator ? Math.max(pull, refreshing ? THRESHOLD : pull) : 0 }}
        aria-hidden={!showIndicator}
      >
        <div
          className={`mb-2 h-6 w-6 rounded-full border-2 border-emerald-600 border-t-transparent ${
            refreshing ? 'animate-spin' : ''
          }`}
        />
      </div>
      {children}
    </div>
  );
};
