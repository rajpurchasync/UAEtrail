/** Scroll a horizontal overflow track without moving the document (avoids scrollIntoView page jump). */
export const scrollHorizontalTrackToIndex = (
  track: HTMLElement,
  index: number,
  behavior: ScrollBehavior = 'smooth'
) => {
  const slide = track.children[index] as HTMLElement | undefined;
  if (!slide) return;
  const targetLeft = slide.offsetLeft;
  track.scrollTo({ left: targetLeft, behavior });
};
