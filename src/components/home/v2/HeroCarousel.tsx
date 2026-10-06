import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode
} from 'react';
import { Pause, Play } from 'lucide-react';
import { HERO_CAROUSEL_AUTOPLAY_MS, type HeroCarouselSlide } from './heroCarouselTypes';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';
import { shouldCarouselAutoplay, stepCarouselIndex } from '../../../utils/heroCarouselState';

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
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);
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

  const autoplay = shouldCarouselAutoplay({
    reducedMotion,
    userPaused,
    hovered,
    focused,
    touching
  });

  useEffect(() => {
    if (!autoplay || total <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => {
        const next = stepCarouselIndex(current, total, 1);
        onActiveIndexChange?.(next);
        return next;
      });
    }, HERO_CAROUSEL_AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [autoplay, onActiveIndexChange, total]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (!multi) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    }
  };

  const togglePause = () => {
    setUserInteracted(true);
    setUserPaused((v) => !v);
  };

  if (total === 0) {
    return (
      <section className={`relative min-h-[var(--hero-height-mobile)] bg-home-ink md:min-h-[560px] ${className}`}>
        {children}
      </section>
    );
  }

  const liveMessage = `Slide ${index + 1} of ${total}`;

  return (
    <section
      id={regionId}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured outdoor activities"
      tabIndex={multi ? 0 : undefined}
      className={`relative flex min-h-[var(--hero-height-mobile)] flex-col justify-end overflow-hidden md:min-h-[560px] md:max-h-[640px] ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
      }}
      onKeyDown={onKeyDown}
      onTouchStart={(e) => {
        setTouching(true);
        touchStartX.current = e.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        setTouching(false);
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
        const active = slideIndex === index;
        return (
          <img
            key={slide.id}
            src={slide.imageUrl}
            srcSet={slide.imageSrcSet}
            alt={slide.alt}
            width={1600}
            height={900}
            decoding={slideIndex === 0 ? 'sync' : 'async'}
            loading={slideIndex === 0 ? 'eager' : 'lazy'}
            fetchPriority={slideIndex === 0 ? 'high' : 'auto'}
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

      {multi ? (
        <>
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 md:hidden">
            <div className="flex items-center gap-2">
              {slides.map((slide, dotIndex) => (
                <Dot
                  key={slide.id}
                  active={dotIndex === index}
                  label={`Go to slide ${dotIndex + 1}`}
                  progress={autoplay && dotIndex === index && !reducedMotion}
                  onSelect={() => {
                    setUserInteracted(true);
                    goTo(dotIndex);
                  }}
                />
              ))}
            </div>
            <CarouselPlayPauseButton paused={userPaused} onToggle={togglePause} className="h-8 w-8" iconClassName="h-3.5 w-3.5" />
          </div>

          <div className="absolute bottom-6 right-6 z-20 hidden items-center gap-3 md:flex">
            <button
              type="button"
              className="home-focus-ring flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
              onClick={() => step(-1)}
              aria-label="Previous slide"
            >
              ‹
            </button>
            <button
              type="button"
              className="home-focus-ring flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
              onClick={() => step(1)}
              aria-label="Next slide"
            >
              ›
            </button>
            <div className="flex gap-2">
              {slides.map((slide, dotIndex) => (
                <Dot
                  key={`desktop-${slide.id}`}
                  active={dotIndex === index}
                  label={`Go to slide ${dotIndex + 1}`}
                  progress={autoplay && dotIndex === index && !reducedMotion}
                  onSelect={() => {
                    setUserInteracted(true);
                    goTo(dotIndex);
                  }}
                />
              ))}
            </div>
            <CarouselPlayPauseButton paused={userPaused} onToggle={togglePause} />
          </div>
        </>
      ) : null}

      <div aria-live={userInteracted ? 'polite' : 'off'} className="sr-only">
        {userInteracted ? liveMessage : ''}
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center">{children}</div>
    </section>
  );
};

const CarouselPlayPauseButton = ({
  paused,
  onToggle,
  className = 'h-10 w-10',
  iconClassName = 'h-4 w-4'
}: {
  paused: boolean;
  onToggle: () => void;
  className?: string;
  iconClassName?: string;
}) => (
  <button
    type="button"
    className={`home-focus-ring flex shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 ${className}`}
    onClick={onToggle}
    aria-pressed={paused}
    aria-label={paused ? 'Play carousel' : 'Pause carousel'}
  >
    {paused ? <Play className={iconClassName} aria-hidden /> : <Pause className={iconClassName} aria-hidden />}
  </button>
);

const Dot = ({
  active,
  label,
  progress,
  onSelect
}: {
  active: boolean;
  label: string;
  progress: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    className="home-focus-ring flex h-6 w-6 items-center justify-center rounded-full"
    aria-label={label}
    aria-current={active ? 'true' : undefined}
    onClick={onSelect}
  >
    <span className="relative h-2.5 w-2.5 overflow-hidden rounded-full bg-white/35">
      <span
        className={[
          'absolute inset-0 rounded-full bg-white',
          active ? 'opacity-100' : 'opacity-0'
        ].join(' ')}
      />
      {progress ? (
        <span
          className="absolute inset-0 origin-left rounded-full bg-white motion-safe:animate-[hero-dot-fill_var(--hero-autoplay)_linear_forwards]"
          style={{ ['--hero-autoplay' as string]: `${HERO_CAROUSEL_AUTOPLAY_MS}ms` }}
        />
      ) : null}
    </span>
  </button>
);
