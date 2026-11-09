import { useLayoutEffect, type RefObject } from 'react';

export const HORIZONTAL_DRAG_CLICK_PX = 6;

export const horizontalRailCanScroll = (el: HTMLElement): boolean => el.scrollWidth > el.clientWidth + 1;

export const horizontalDragExceededClickSlop = (dx: number): boolean =>
  Math.abs(dx) > HORIZONTAL_DRAG_CLICK_PX;

/** Map vertical wheel to horizontal scroll when the rail overflows; let the page take over at the ends. */
export const horizontalWheelDelta = (
  el: HTMLElement,
  deltaX: number,
  deltaY: number
): number | null => {
  if (!horizontalRailCanScroll(el)) return null;
  const primary = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
  if (primary === 0) return null;
  const atStart = el.scrollLeft <= 0;
  const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
  if ((primary > 0 && atEnd) || (primary < 0 && atStart)) return null;
  return primary;
};

/** Mouse drag + wheel on overflow-x rails. Touch keeps native swipe scrolling. */
export const useHorizontalDragScroll = (ref: RefObject<HTMLElement | null>): void => {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const syncCursor = () => {
      el.style.cursor = horizontalRailCanScroll(el) ? 'grab' : '';
    };
    syncCursor();
    const observer = new ResizeObserver(syncCursor);
    observer.observe(el);

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startLeft = 0;
    let prevBehavior = '';
    let prevUserSelect = '';

    const onDragStart = (event: DragEvent) => {
      event.preventDefault();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || event.button !== 0) return;
      dragging = true;
      moved = false;
      startX = event.clientX;
      startLeft = el.scrollLeft;
      prevBehavior = el.style.scrollBehavior;
      prevUserSelect = el.style.userSelect;
      el.style.scrollBehavior = 'auto';
      el.style.userSelect = 'none';
      el.style.cursor = 'grabbing';
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      if (!moved && horizontalDragExceededClickSlop(dx)) {
        moved = true;
      }
      if (!moved) return;
      event.preventDefault();
      el.scrollLeft = startLeft - dx;
    };

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      el.style.scrollBehavior = prevBehavior;
      el.style.userSelect = prevUserSelect;
      syncCursor();
      if (!moved) return;
      const blockClick = (click: Event) => {
        click.preventDefault();
        click.stopPropagation();
      };
      el.addEventListener('click', blockClick, { capture: true, once: true });
    };

    const onWheel = (event: WheelEvent) => {
      const delta = horizontalWheelDelta(el, event.deltaX, event.deltaY);
      if (delta == null) return;
      el.scrollLeft += delta;
      event.preventDefault();
    };

    el.addEventListener('dragstart', onDragStart);
    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      observer.disconnect();
      el.removeEventListener('dragstart', onDragStart);
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      el.removeEventListener('wheel', onWheel);
    };
  }, [ref]);
};
