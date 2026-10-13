import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { stepCarouselIndex } from '../../../utils/heroCarouselState';
import { useMarketingCarouselClock } from './HomeMarketingCarouselSync';
import {
  carouselPageCount,
  carouselPageFromCardIndex,
  carouselStartCardIndex,
  measureVisibleCarouselCards
} from './measureVisibleCarouselCards';
import { scrollHorizontalTrackToIndex } from './scrollHorizontalTrackToIndex';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';

export const useMarketingPeekCarousel = ({
  itemCount,
  carouselMode,
  resetWhen,
  trackRef: trackRefProp
}: {
  itemCount: number;
  carouselMode: boolean;
  /** When any value changes, scroll position and active index reset to 0. */
  resetWhen: unknown[];
  trackRef?: RefObject<HTMLDivElement | null>;
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const internalTrackRef = useRef<HTMLDivElement>(null);
  const trackRef = trackRefProp ?? internalTrackRef;
  const [activePage, setActivePage] = useState(0);
  const activePageRef = useRef(0);
  const [visibleCardCount, setVisibleCardCount] = useState(1);
  const visibleCardCountRef = useRef(1);
  const [userPaused, setUserPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [progressCycle, setProgressCycle] = useState(0);

  const pageCount = carouselPageCount(itemCount, visibleCardCount);

  useEffect(() => {
    activePageRef.current = activePage;
  }, [activePage]);

  const remeasureVisible = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const next = measureVisibleCarouselCards(track, 0);
    visibleCardCountRef.current = next;
    setVisibleCardCount(next);
  }, [trackRef]);

  useLayoutEffect(() => {
    if (!carouselMode) return;
    remeasureVisible();
    const track = trackRef.current;
    if (!track) return;

    const ro = new ResizeObserver(remeasureVisible);
    ro.observe(track);
    window.addEventListener('resize', remeasureVisible, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', remeasureVisible);
    };
  }, [carouselMode, itemCount, remeasureVisible, trackRef]);

  useEffect(() => {
    if (activePage >= pageCount && pageCount > 0) {
      setActivePage(pageCount - 1);
    }
  }, [activePage, pageCount]);

  const scrollToPage = useCallback(
    (page: number, options?: { bumpProgress?: boolean }) => {
      const track = trackRef.current;
      if (!track || itemCount === 0 || pageCount === 0) return;
      const next = Math.max(0, Math.min(page, pageCount - 1));
      if (options?.bumpProgress && next !== activePageRef.current) {
        setProgressCycle((cycle) => cycle + 1);
      }
      if (carouselMode) {
        const cardIndex = carouselStartCardIndex(next, visibleCardCount, itemCount);
        scrollHorizontalTrackToIndex(track, cardIndex, 'smooth');
      }
      setActivePage(next);
    },
    [carouselMode, itemCount, pageCount, trackRef, visibleCardCount]
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !carouselMode) return;

    const onScroll = () => {
      const children = Array.from(track.children) as HTMLElement[];
      if (children.length === 0) return;
      const trackLeft = track.scrollLeft;
      let closestCard = 0;
      let minDist = Number.POSITIVE_INFINITY;
      children.forEach((child, i) => {
        const dist = Math.abs(child.offsetLeft - trackLeft);
        if (dist < minDist) {
          minDist = dist;
          closestCard = i;
        }
      });
      const visible = visibleCardCountRef.current;
      const pages = carouselPageCount(itemCount, visible);
      const page = carouselPageFromCardIndex(closestCard, visible, pages);
      setActivePage(page);
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, [carouselMode, itemCount, trackRef]);

  useEffect(() => {
    setActivePage(0);
    trackRef.current?.scrollTo({ left: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- explicit reset keys from caller
  }, resetWhen);

  const autoplayActive = carouselMode && !reducedMotion && !userPaused && !hoverPaused;

  useMarketingCarouselClock(() => {
    scrollToPage(stepCarouselIndex(activePageRef.current, pageCount, 1), { bumpProgress: false });
    setProgressCycle((cycle) => cycle + 1);
  }, autoplayActive);

  return {
    trackRef,
    activePage,
    pageCount,
    visibleCardCount,
    scrollToPage,
    userPaused,
    setUserPaused,
    hoverPaused,
    setHoverPaused,
    progressCycle,
    autoplayActive,
    reducedMotion
  };
};
