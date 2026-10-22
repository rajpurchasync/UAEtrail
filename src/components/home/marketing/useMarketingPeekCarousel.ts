import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { stepCarouselIndex } from '../../../utils/heroCarouselState';
import {
  CAROUSEL_SCROLL_EDGE_EPS_PX,
  carouselPageCount,
  carouselStartCardIndex,
  measureCarouselActivePage,
  measureVisibleCarouselCards,
  trackHasHorizontalScroll
} from './measureVisibleCarouselCards';
import { scrollHorizontalTrackToIndex } from './scrollHorizontalTrackToIndex';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';
import { HERO_CAROUSEL_AUTOPLAY_MS } from './heroCarouselTypes';

export const useMarketingPeekCarousel = ({
  itemCount,
  carouselMode,
  resetWhen,
  trackRef: trackRefProp,
  /** Mobile peek rails: one dot per card (not “fully visible” count at scroll 0). */
  oneCardPerPage = false
}: {
  itemCount: number;
  carouselMode: boolean;
  /** When any value changes, scroll position and active index reset to 0. */
  resetWhen: unknown[];
  trackRef?: RefObject<HTMLDivElement | null>;
  oneCardPerPage?: boolean;
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
  const [trackScrollable, setTrackScrollable] = useState(true);
  const pendingScrollPageRef = useRef<number | null>(null);

  const paginationVisibleCount = oneCardPerPage ? 1 : visibleCardCount;
  const pageCount =
    itemCount <= 0
      ? 0
      : !trackScrollable
        ? 1
        : oneCardPerPage
          ? itemCount
          : carouselPageCount(itemCount, visibleCardCount);
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
    setTrackScrollable(trackHasHorizontalScroll(track));
    if (oneCardPerPage) {
      visibleCardCountRef.current = 1;
      setVisibleCardCount(1);
      return;
    }
    const next = measureVisibleCarouselCards(track, 0);
    visibleCardCountRef.current = next;
    setVisibleCardCount(next);
  }, [oneCardPerPage, trackRef]);

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
  }, [carouselMode, itemCount, oneCardPerPage, remeasureVisible, trackRef]);

  useEffect(() => {
    if (activePage >= pageCount && pageCount > 0) {
      setActivePage(pageCount - 1);
    }
  }, [activePage, pageCount]);

  const scrollToPage = useCallback(
    (page: number, options?: { bumpProgress?: boolean }) => {
      const track = trackRef.current;
      const pages = pageCountRef.current;
      const visible = oneCardPerPage ? 1 : visibleCardCountRef.current;
      if (!track || itemCount === 0 || pages === 0) return;
      const next = Math.max(0, Math.min(page, pages - 1));
      if (options?.bumpProgress && next !== activePageRef.current) {
        setProgressCycle((cycle) => cycle + 1);
      }
      pendingScrollPageRef.current = next;
      if (carouselMode && trackScrollable) {
        const cardIndex = carouselStartCardIndex(next, visible, itemCount);
        const slide = track.children[cardIndex] as HTMLElement | undefined;
        const targetLeft = slide?.offsetLeft ?? 0;
        scrollHorizontalTrackToIndex(track, cardIndex, 'smooth');
        if (Math.abs(track.scrollLeft - targetLeft) <= CAROUSEL_SCROLL_EDGE_EPS_PX) {
          pendingScrollPageRef.current = null;
        }
      } else {
        pendingScrollPageRef.current = null;
      }
      activePageRef.current = next;
      setActivePage(next);
    },
    [carouselMode, itemCount, oneCardPerPage, trackRef, trackScrollable]
  );

  const scrollToPageRef = useRef(scrollToPage);
  scrollToPageRef.current = scrollToPage;

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !carouselMode) return;

    const syncPageFromScroll = () => {
      const visible = oneCardPerPage ? 1 : visibleCardCountRef.current;
      const page = measureCarouselActivePage(track, itemCount, visible);
      const pending = pendingScrollPageRef.current;
      if (pending !== null) {
        if (page === pending) {
          pendingScrollPageRef.current = null;
        }
        return;
      }
      if (page !== activePageRef.current) {
        activePageRef.current = page;
        setActivePage(page);
      }
    };

    const onScroll = () => syncPageFromScroll();
    const onScrollEnd = () => {
      const pending = pendingScrollPageRef.current;
      if (pending === null) {
        syncPageFromScroll();
        return;
      }
      pendingScrollPageRef.current = null;
      const visible = oneCardPerPage ? 1 : visibleCardCountRef.current;
      const measured = measureCarouselActivePage(track, itemCount, visible);
      const resolved = measured === pending ? measured : pending;
      if (resolved !== activePageRef.current) {
        activePageRef.current = resolved;
        setActivePage(resolved);
      }
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    track.addEventListener('scrollend', onScrollEnd);
    return () => {
      track.removeEventListener('scroll', onScroll);
      track.removeEventListener('scrollend', onScrollEnd);
    };
  }, [carouselMode, itemCount, oneCardPerPage, trackRef]);

  useEffect(() => {
    pendingScrollPageRef.current = null;
    activePageRef.current = 0;
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
    visibleCardCount: paginationVisibleCount,
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
