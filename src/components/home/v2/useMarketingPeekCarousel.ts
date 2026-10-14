import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { stepCarouselIndex } from '../../../utils/heroCarouselState';
import {
  carouselPageCount,
  carouselPageFromCardIndex,
  carouselStartCardIndex,
  measureVisibleCarouselCards
} from './measureVisibleCarouselCards';
import { scrollHorizontalTrackToIndex } from './scrollHorizontalTrackToIndex';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';
import { HERO_CAROUSEL_AUTOPLAY_MS } from './heroCarouselTypes';

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
  const pageCountRef = useRef(pageCount);
  const [tabVisible, setTabVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible'
  );

  useEffect(() => {
    activePageRef.current = activePage;
  }, [activePage]);

  useEffect(() => {
    pageCountRef.current = pageCount;
  }, [pageCount]);

  useEffect(() => {
    const onVisibility = () => setTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

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
      const pages = pageCountRef.current;
      const visible = visibleCardCountRef.current;
      if (!track || itemCount === 0 || pages === 0) return;
      const next = Math.max(0, Math.min(page, pages - 1));
      if (options?.bumpProgress && next !== activePageRef.current) {
        setProgressCycle((cycle) => cycle + 1);
      }
      if (carouselMode) {
        const cardIndex = carouselStartCardIndex(next, visible, itemCount);
        scrollHorizontalTrackToIndex(track, cardIndex, 'smooth');
      }
      setActivePage(next);
    },
    [carouselMode, itemCount, trackRef]
  );

  const scrollToPageRef = useRef(scrollToPage);
  scrollToPageRef.current = scrollToPage;

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
    setProgressCycle((cycle) => cycle + 1);
    trackRef.current?.scrollTo({ left: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- explicit reset keys from caller
  }, resetWhen);

  const autoplayActive =
    carouselMode &&
    pageCount > 1 &&
    !reducedMotion &&
    !userPaused &&
    !hoverPaused &&
    tabVisible;

  /** Per-carousel timer keeps the progress ring and slide advance on the same 5.5s beat (hover/tab pause included). */
  useEffect(() => {
    if (!autoplayActive) return;

    setProgressCycle((cycle) => cycle + 1);

    let timeoutId = 0;
    const scheduleTick = () => {
      timeoutId = window.setTimeout(() => {
        const pages = pageCountRef.current;
        if (pages <= 1) return;
        const current = activePageRef.current;
        const next = stepCarouselIndex(current, pages, 1);
        scrollToPageRef.current(next, { bumpProgress: false });
        setProgressCycle((cycle) => cycle + 1);
        scheduleTick();
      }, HERO_CAROUSEL_AUTOPLAY_MS);
    };

    scheduleTick();
    return () => window.clearTimeout(timeoutId);
  }, [autoplayActive]);


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
