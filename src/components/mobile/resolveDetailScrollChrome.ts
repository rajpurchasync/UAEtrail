import type { DetailScrollChrome } from './useDetailScrollChrome';

const SCROLL_EDGE_PX = 8;

export const resolveDetailScrollChrome = (metrics: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}): DetailScrollChrome => {
  const { scrollTop, scrollHeight, clientHeight } = metrics;
  const overflow = scrollHeight - clientHeight > SCROLL_EDGE_PX;
  const atBottom = scrollTop + clientHeight >= scrollHeight - SCROLL_EDGE_PX;

  return {
    headerFrosted: scrollTop > SCROLL_EDGE_PX,
    footerFrosted: overflow && !atBottom,
  };
};
