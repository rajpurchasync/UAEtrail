import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { HeroCarouselSlide } from './heroCarouselTypes';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';
import { stepCarouselIndex } from '../../../utils/heroCarouselState';
import { useMarketingCarouselClock } from './HomeMarketingCarouselSync';
import { HeroCarouselSlideImage } from './HeroCarouselSlideImage';

export interface HeroCarouselProps {
  slides: HeroCarouselSlide[];
  onActiveIndexChange?: (index: number) => void;
  children?: ReactNode;
  className?: string;
}

export const HeroCarousel = ({
  slides,
  onActiveIndexChange,
  children,
  className = ''
}: HeroCarouselProps) => {
  const reducedMotion = usePrefersReducedMotion();
  const regionId = useId();
  const [index, setIndex] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const [prefetchNeighbors, setPrefetchNeighbors] = useState(false);
  const [lcpReady, setLcpReady] = useState(false);
  const total = slides.length;
  const multi = total > 1;

  useEffect(() => {
    if (!lcpReady) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;
    const enable = () => setPrefetchNeighbors(true);

    if (typeof requestIdleCallback !== 'undefined') {
      idleId = requestIdleCallback(enable, { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(enable, 800);
    }

    return () => {
      if (idleId !== undefined && typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [lcpReady]);

  const markLcpReady = useCallback(() => setLcpReady(true), []);

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return;
      const clamped = ((next % total) + total) % total;
      setIndex(clamped);
      onActiveIndexChange?.(clamped);
    },
    [onActiveIndexChange, total]
  );

  const step = useCallback(
    (delta: 1 | -1) => {
      setUserInteracted(true);
      goTo(stepCarouselIndex(index, total, delta));
    },
    [goTo, index, total]
  );

  /** Wait for the first full-res paint so autoplay does not steal bandwidth from LCP. */
  const autoplayActive = multi && !reducedMotion && lcpReady;

  useMarketingCarouselClock(() => {
    if (total <= 1) return;
    setIndex((current) => {
      const next = stepCarouselIndex(current, total, 1);
      onActiveIndexChange?.(next);
      return next;
    });
  }, autoplayActive);

  if (total === 0) {
    return (
      <section
        className={`relative min-h-[var(--hero-height-mobile)] bg-home-ink md:min-h-[var(--hero-height-desktop)] ${className}`}
      >
        {children}
      </section>
    );
  }

  const liveMessage = `Slide ${index + 1} of ${total}`;

  const slideShouldMount = (slideIndex: number) => {
    if (slideIndex === index) return true;
    if (!prefetchNeighbors || total <= 1) return false;
    const prev = (index - 1 + total) % total;
    const next = (index + 1) % total;
    return slideIndex === prev || slideIndex === next;
  };

  return (
    <section
      id={regionId}
      aria-label="Home hero"
      className={`relative flex min-h-[var(--hero-height-mobile)] flex-col justify-center overflow-hidden md:min-h-[var(--hero-height-desktop)] ${className}`}
      onTouchStart={(e) => {
        touchStartX.current = e.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start == null || !multi) return;
        const end = e.changedTouches[0]?.clientX ?? start;
        const delta = end - start;
        if (Math.abs(delta) < 48) return;
        setUserInteracted(true);
        step(delta > 0 ? -1 : 1);
      }}
    >
      <div className="absolute inset-0 z-0" aria-hidden>
        <div className="absolute inset-0 bg-home-ink" />

        {slides.map((slide, slideIndex) => {
          if (!slideShouldMount(slideIndex)) return null;
          const active = slideIndex === index;
          const prev = (index - 1 + total) % total;
          const next = (index + 1) % total;
          const isNeighbor = slideIndex === prev || slideIndex === next;
          const loadFullResolution = active || (prefetchNeighbors && isNeighbor);

          return (
            <HeroCarouselSlideImage
              key={slide.id}
              slide={slide}
              active={active}
              reducedMotion={reducedMotion}
              loadFullResolution={loadFullResolution}
              onHiResReady={active ? markLcpReady : undefined}
            />
          );
        })}
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[2] md:hidden"
        style={{ background: 'var(--hero-overlay-mobile)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] hidden md:block"
        style={{ background: 'var(--hero-overlay)' }}
        aria-hidden
      />

      <div aria-live={userInteracted ? 'polite' : 'off'} className="sr-only">
        {userInteracted ? liveMessage : ''}
      </div>

      <div className="relative z-10 flex w-full flex-col items-center justify-center pb-[var(--space-3)] md:pb-[var(--space-4)]">
        {children}
      </div>
    </section>
  );
};
