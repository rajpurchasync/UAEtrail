import { useCallback, useEffect, useRef } from 'react';
import { applyPanelResizeCursor, clearPanelResizeCursor } from '../../config/panelResizeCursor';
import { LIST_BROWSE_MAX_PX, LIST_BROWSE_MIN_PX } from '../browse/listDiscoverySideMapSplit';

type Props = {
  onWidthChange: (width: number) => void;
  getStartWidth: () => number;
  onResizeCommit?: () => void;
  ariaValueNow: number;
  ariaValueMax?: number;
};

/** Divider between browse list and side map — drag adjusts list column width. */
export const ListSideMapResizeHandle = ({
  onWidthChange,
  getStartWidth,
  onResizeCommit,
  ariaValueNow,
  ariaValueMax = LIST_BROWSE_MAX_PX,
}: Props) => {
  const dragRef = useRef<{ startX: number; startListWidth: number; pointerId: number } | null>(null);

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      onWidthChange(drag.startListWidth + (event.clientX - drag.startX));
    },
    [onWidthChange]
  );

  const onPointerUp = useCallback(
    (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      clearPanelResizeCursor();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      onResizeCommit?.();
    },
    [onPointerMove, onResizeCommit]
  );

  useEffect(
    () => () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      clearPanelResizeCursor();
    },
    [onPointerMove, onPointerUp]
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startListWidth: getStartWidth(),
      pointerId: event.pointerId,
    };
    applyPanelResizeCursor();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 32 : 16;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onWidthChange(getStartWidth() + step);
      onResizeCommit?.();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onWidthChange(getStartWidth() - step);
      onResizeCommit?.();
    }
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Drag to resize map panel"
      aria-valuemin={LIST_BROWSE_MIN_PX}
      aria-valuemax={ariaValueMax}
      aria-valuenow={ariaValueNow}
      title="Drag to resize"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      className="group/resize relative z-[10] flex w-3 shrink-0 cursor-ew-resize touch-none items-center justify-center self-stretch border-l border-neutral-200 bg-neutral-50 max-md:hidden"
      style={{ touchAction: 'none' }}
    >
      <span className="pointer-events-none relative flex flex-col gap-[3px]" aria-hidden>
        {Array.from({ length: 6 }, (_, index) => (
          <span
            key={index}
            className="h-[3px] w-[3px] rounded-full bg-neutral-400 shadow-[0_0_0_1px_rgba(255,255,255,.85)] transition-colors group-hover/resize:bg-neutral-600 group-focus-visible/resize:bg-neutral-600"
          />
        ))}
      </span>
    </div>
  );
};
