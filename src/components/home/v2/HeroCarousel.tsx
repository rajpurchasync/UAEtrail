import { useCallback, useId, useRef, useState, type ReactNode } from 'react';
import type { HeroCarouselSlide } from './heroCarouselTypes';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';
import { stepCarouselIndex } from '../../../utils/heroCarouselState';
import { useMarketingCarouselClock } from './HomeMarketingCarouselSync';

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
  const total = slides.length;
  const multi = total > 1;

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

  /** Background-only hero — keep rotating even when the pointer is over the hero on load/refresh. */
  const autoplayActive = multi && !reducedMotion;

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
    if (total <= 1) return slideIndex === index;
    const prev = (index - 1 + total) % total;
    const next = (index + 1) % total;
    return slideIndex === index || slideIndex === prev || slideIndex === next;
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
      <div className="absolute inset-0 bg-home-ink" aria-hidden />

      {slides.map((slide, slideIndex) => {
        if (!slideShouldMount(slideIndex)) return null;
        const active = slideIndex === index;
        return (
          <img
            key={slide.id}
            src={slide.imageUrl}
            srcSet={slide.imageSrcSet}
            alt={active ? slide.alt : ''}
            width={1600}
            height={900}
            decoding={active ? 'sync' : 'async'}
            loading={active ? 'eager' : 'lazy'}
            fetchPriority={active ? 'high' : 'auto'}
            className={[
              'absolute inset-0 h-full w-full object-cover',
              reducedMotion ? '' : 'transition-opacity duration-[var(--duration-carousel)] ease-[var(--ease-out)]',
              active ? 'opacity-100' : 'opacity-0'
            ].join(' ')}
            aria-hidden={!active}
          />
        );
      })}

      <div
        className="pointer-events-none absolute inset-0 md:hidden"
        style={{ background: 'var(--hero-overlay-mobile)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
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
