/** How many card children fit fully in the track viewport at scrollLeft (default 0). */
export function measureVisibleCarouselCards(track: HTMLElement, scrollLeft = track.scrollLeft): number {
  const children = Array.from(track.children) as HTMLElement[];
  if (children.length === 0) return 1;

  const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
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
