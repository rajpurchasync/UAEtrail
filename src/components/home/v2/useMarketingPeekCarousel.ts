import { useCallback, useEffect, useRef, useState } from 'react';
import { stepCarouselIndex } from '../../../utils/heroCarouselState';
import { useMarketingCarouselClock } from './HomeMarketingCarouselSync';
import { scrollHorizontalTrackToIndex } from './scrollHorizontalTrackToIndex';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';

export const useMarketingPeekCarousel = ({
  itemCount,
  carouselMode,
  resetWhen
}: {
  itemCount: number;
  carouselMode: boolean;
  /** When any value changes, scroll position and active index reset to 0. */
  resetWhen: unknown[];
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [progressCycle, setProgressCycle] = useState(0);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const scrollToIndex = useCallback(
    (index: number, options?: { bumpProgress?: boolean }) => {
      const track = trackRef.current;
      if (!track || itemCount === 0) return;
      const next = Math.max(0, Math.min(index, itemCount - 1));
      if (options?.bumpProgress && next !== activeIndexRef.current) {
        setProgressCycle((cycle) => cycle + 1);
      }
      if (carouselMode) {
        scrollHorizontalTrackToIndex(track, next, 'smooth');
      }
      setActiveIndex(next);
    },
    [carouselMode, itemCount]
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !carouselMode) return;

    const onScroll = () => {
      const children = Array.from(track.children) as HTMLElement[];
      if (children.length === 0) return;
      const trackLeft = track.scrollLeft;
      let closest = 0;
      let minDist = Number.POSITIVE_INFINITY;
      children.forEach((child, i) => {
        const dist = Math.abs(child.offsetLeft - trackLeft);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      setActiveIndex(closest);
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, [carouselMode, itemCount]);

  useEffect(() => {
    setActiveIndex(0);
    trackRef.current?.scrollTo({ left: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- explicit reset keys from caller
  }, resetWhen);

  const autoplayActive = carouselMode && !reducedMotion && !userPaused && !hoverPaused;

  useMarketingCarouselClock(() => {
    scrollToIndex(stepCarouselIndex(activeIndexRef.current, itemCount, 1), { bumpProgress: false });
    setProgressCycle((cycle) => cycle + 1);
  }, autoplayActive);

  return {
    trackRef,
    activeIndex,
    scrollToIndex,
    userPaused,
    setUserPaused,
    hoverPaused,
    setHoverPaused,
    progressCycle,
    autoplayActive,
    reducedMotion
  };
};
