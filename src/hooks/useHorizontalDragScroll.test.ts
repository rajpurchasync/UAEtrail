import { describe, expect, it } from 'vitest';
import {
  HORIZONTAL_DRAG_CLICK_PX,
  horizontalDragExceededClickSlop,
  horizontalRailCanScroll,
  horizontalWheelDelta,
} from './useHorizontalDragScroll';

describe('horizontal drag scroll helpers', () => {
  it('treats overflow as scrollable', () => {
    expect(horizontalRailCanScroll({ scrollWidth: 800, clientWidth: 400 } as HTMLElement)).toBe(true);
    expect(horizontalRailCanScroll({ scrollWidth: 400, clientWidth: 400 } as HTMLElement)).toBe(false);
  });

  it('ignores tiny pointer jitter as a click', () => {
    expect(horizontalDragExceededClickSlop(HORIZONTAL_DRAG_CLICK_PX)).toBe(false);
    expect(horizontalDragExceededClickSlop(HORIZONTAL_DRAG_CLICK_PX + 1)).toBe(true);
  });

  it('maps vertical wheel to horizontal until the rail ends', () => {
    const el = { scrollWidth: 800, clientWidth: 400, scrollLeft: 40 } as HTMLElement;
    expect(horizontalWheelDelta(el, 0, 30)).toBe(30);
    el.scrollLeft = 0;
    expect(horizontalWheelDelta(el, 0, -20)).toBeNull();
    el.scrollLeft = 400;
    expect(horizontalWheelDelta(el, 0, 20)).toBeNull();
  });
});
