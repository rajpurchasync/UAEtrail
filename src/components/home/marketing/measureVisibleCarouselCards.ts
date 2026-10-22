/** How many card children fit fully in the track viewport at scrollLeft (default 0). */
export function measureVisibleCarouselCards(track: HTMLElement, scrollLeft = track.scrollLeft): number {
  const children = Array.from(track.children) as HTMLElement[];
  if (children.length === 0) return 1;

  const viewportRight = scrollLeft + track.clientWidth;
  let count = 0;

  for (const child of children) {
    const left = child.offsetLeft;
    const right = left + child.offsetWidth;
    if (left < scrollLeft - 1) continue;
    if (right <= viewportRight + 1) {
      count++;
    } else {
      break;
    }
  }

  if (count === 0) {
    // Peek layout — at least one “page” per viewport advance
    return 1;
  }

  return count;
}

export function carouselPageCount(itemCount: number, visibleCardCount: number): number {
  if (itemCount <= 0) return 0;
  return Math.max(1, Math.ceil(itemCount / Math.max(1, visibleCardCount)));
}

export function carouselPageFromCardIndex(cardIndex: number, visibleCardCount: number, pageCount: number): number {
  const page = Math.floor(cardIndex / Math.max(1, visibleCardCount));
  return Math.max(0, Math.min(page, pageCount - 1));
}

export function carouselStartCardIndex(page: number, visibleCardCount: number, itemCount: number): number {
  const start = page * Math.max(1, visibleCardCount);
  return Math.max(0, Math.min(start, itemCount - 1));
}

export const CAROUSEL_SCROLL_EDGE_EPS_PX = 3;

export function trackHasHorizontalScroll(track: HTMLElement): boolean {
  return track.scrollWidth - track.clientWidth > CAROUSEL_SCROLL_EDGE_EPS_PX;
}

/** Snap scroll edges to first/last page so peek layouts don’t stick one page short. */
export function carouselPageFromScrollPosition(
  scrollLeft: number,
  maxScrollLeft: number,
  pageCount: number,
  pageFromClosestCard: number
): number {
  if (pageCount <= 1) return 0;
  if (maxScrollLeft <= CAROUSEL_SCROLL_EDGE_EPS_PX) return 0;
  if (scrollLeft >= maxScrollLeft - CAROUSEL_SCROLL_EDGE_EPS_PX) return pageCount - 1;
  if (scrollLeft <= CAROUSEL_SCROLL_EDGE_EPS_PX) return 0;
  return Math.max(0, Math.min(pageFromClosestCard, pageCount - 1));
}

export function measureCarouselActivePage(
  track: HTMLElement,
  itemCount: number,
  visibleCardCount: number
): number {
  const pageCount = carouselPageCount(itemCount, visibleCardCount);
  const children = Array.from(track.children) as HTMLElement[];
  if (pageCount <= 1 || children.length === 0) return 0;

  const scrollLeft = track.scrollLeft;
  const maxScrollLeft = track.scrollWidth - track.clientWidth;

  let closestCard = 0;
  let minDist = Number.POSITIVE_INFINITY;
  children.forEach((child, i) => {
    const dist = Math.abs(child.offsetLeft - scrollLeft);
    if (dist < minDist) {
      minDist = dist;
      closestCard = i;
    }
  });

  const pageFromCard = carouselPageFromCardIndex(closestCard, visibleCardCount, pageCount);
  return carouselPageFromScrollPosition(scrollLeft, maxScrollLeft, pageCount, pageFromCard);
}
