import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { stepCarouselIndex } from '../../../utils/heroCarouselState';
import type { ActivityCardProps } from './ActivityCard';
import { ActivityCard, ActivityCardSkeleton } from './ActivityCard';

const CARD_PEEK_CLASS =
  'w-[min(88vw,22rem)] shrink-0 snap-start scroll-ml-[var(--gutter-mobile)] md:w-[calc((100%-1rem)/2.15)] md:scroll-ml-0 lg:w-[calc((100%-2rem)/2.35)]';

export interface ActivityCardCarouselProps {
  cards: ActivityCardProps[];
  loading?: boolean;
  skeletonCount?: number;
  emptyState?: ReactNode;
}

export const ActivityCardCarousel = ({
  cards,
  loading = false,
  skeletonCount = 6,
  emptyState
}: ActivityCardCarouselProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const itemCount = loading ? skeletonCount : cards.length;
  const multi = itemCount > 1;

  const scrollToIndex = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track || itemCount === 0) return;
      const next = Math.max(0, Math.min(index, itemCount - 1));
      const slide = track.children[next] as HTMLElement | undefined;
      slide?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      setActiveIndex(next);
    },
    [itemCount]
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track || loading) return;

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
  }, [loading, cards.length]);

  useEffect(() => {
    setActiveIndex(0);
    trackRef.current?.scrollTo({ left: 0 });
  }, [cards.length, loading]);

  if (!loading && cards.length === 0 && emptyState) {
    return <div className="py-8 text-center">{emptyState}</div>;
  }

  return (
    <div className="relative">
      <div
        className="-mx-[var(--gutter-mobile)] flex gap-4 overflow-x-auto scroll-smooth px-[var(--gutter-mobile)] pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] md:-mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
        ref={trackRef}
        aria-label="Activity cards"
      >
        {loading
          ? Array.from({ length: skeletonCount }, (_, i) => (
              <div key={i} className={CARD_PEEK_CLASS}>
                <ActivityCardSkeleton />
              </div>
            ))
          : cards.map((card) => (
              <div key={card.href + card.title} className={CARD_PEEK_CLASS}>
                <ActivityCard {...card} />
              </div>
            ))}
      </div>

      {multi ? (
        <div className="mt-6 flex items-center justify-center gap-4 md:justify-end">
          <button
            type="button"
            className="home-focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-[var(--gray-200)] bg-home-surface text-home-ink shadow-home-card hover:bg-home-muted"
            aria-label="Previous activity"
            onClick={() => scrollToIndex(stepCarouselIndex(activeIndex, itemCount, -1))}
          >
            ‹
          </button>
          <div className="flex" role="group" aria-label="Activity slides">
            {Array.from({ length: itemCount }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-current={i === activeIndex ? 'true' : undefined}
                aria-label={`Go to activity ${i + 1}`}
                className="home-focus-ring flex h-6 min-w-6 items-center justify-center rounded-full px-1"
                onClick={() => scrollToIndex(i)}
              >
                <span
                  className={[
                    'h-2.5 rounded-full transition-all duration-[var(--duration-hover)]',
                    i === activeIndex ? 'w-6 bg-home-green-600' : 'w-2.5 bg-[var(--gray-300)]'
                  ].join(' ')}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="home-focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-[var(--gray-200)] bg-home-surface text-home-ink shadow-home-card hover:bg-home-muted"
            aria-label="Next activity"
            onClick={() => scrollToIndex(stepCarouselIndex(activeIndex, itemCount, 1))}
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
};
