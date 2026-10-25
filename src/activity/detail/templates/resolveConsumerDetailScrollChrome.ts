import type { ConsumerDetailScrollChrome } from './useConsumerDetailScrollChrome';

const SCROLL_EDGE_PX = 8;

export const resolveConsumerDetailScrollChrome = (metrics: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}): ConsumerDetailScrollChrome => {
  const { scrollTop, scrollHeight, clientHeight } = metrics;
  const overflow = scrollHeight - clientHeight > SCROLL_EDGE_PX;
  const atBottom = scrollTop + clientHeight >= scrollHeight - SCROLL_EDGE_PX;

  return {
    headerFrosted: scrollTop > SCROLL_EDGE_PX,
    footerFrosted: overflow && !atBottom,
  };
};
