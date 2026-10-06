import { useCallback, useEffect, useRef, useState } from 'react';
import { stepCarouselIndex } from '../../../utils/heroCarouselState';
import { ReviewCard, type ReviewCardProps } from './ReviewCard';

const CARD_CLASS =
  'w-[min(82vw,19rem)] shrink-0 snap-start scroll-ml-[var(--gutter-mobile)] sm:w-[min(48vw,20rem)] md:w-[calc((100%-1rem)/2.08)] md:scroll-ml-0 lg:w-[calc((100%-2rem)/2.35)]';

export interface ReviewCardCarouselProps {
  reviews: ReviewCardProps[];
}

export const ReviewCardCarousel = ({ reviews }: ReviewCardCarouselProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const total = reviews.length;
  const multi = total > 1;

  const scrollToIndex = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track || total === 0) return;
      const next = Math.max(0, Math.min(index, total - 1));
      const slide = track.children[next] as HTMLElement | undefined;
      slide?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      setActiveIndex(next);
    },
    [total]
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      const children = Array.from(track.children) as HTMLElement[];
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
  }, [reviews.length]);

  if (total === 0) return null;

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="-mx-[var(--gutter-mobile)] flex gap-4 overflow-x-auto scroll-smooth px-[var(--gutter-mobile)] pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] md:-mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
        aria-label="Member reviews"
      >
        {reviews.map((review) => (
          <div key={`${review.name}-${review.emirate}`} className={CARD_CLASS}>
            <ReviewCard {...review} className="h-full" />
          </div>
        ))}
      </div>

      {multi ? (
        <div className="mt-4 flex items-center justify-center gap-3 md:justify-end">
          <button
            type="button"
            className="home-focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-[var(--gray-200)] bg-home-surface text-home-ink shadow-home-card hover:bg-home-muted"
            aria-label="Previous review"
            onClick={() => scrollToIndex(stepCarouselIndex(activeIndex, total, -1))}
          >
            ‹
          </button>
          <div className="flex" role="group" aria-label="Review slides">
            {reviews.map((review, i) => (
              <button
                key={`dot-${review.name}-${i}`}
                type="button"
                aria-current={i === activeIndex ? 'true' : undefined}
                aria-label={`Review ${i + 1}`}
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
            aria-label="Next review"
            onClick={() => scrollToIndex(stepCarouselIndex(activeIndex, total, 1))}
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
};
