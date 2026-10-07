import { stepCarouselIndex } from '../../../utils/heroCarouselState';
import { ReviewCard, type ReviewCardProps } from './ReviewCard';
import { MarketingCarouselControls } from './MarketingCarouselControls';
import { useMarketingPeekCarousel } from './useMarketingPeekCarousel';

/** Wide peek cards — scroll when multiple reviews; avoids equal-column squeeze on desktop. */
const CARD_PEEK_CLASS =
  'w-[min(88vw,22rem)] shrink-0 snap-start scroll-ml-[var(--gutter-mobile)] sm:w-[min(78vw,24rem)] md:w-[calc((100%-1rem)/2.05)] md:scroll-ml-0 lg:w-[calc((100%-2rem)/2.35)] xl:w-[calc((100%-2rem)/2.55)]';

const CARD_STATIC_CLASS = 'w-full max-w-lg mx-auto';

const PEEK_TRACK_CLASS =
  '-mx-[var(--gutter-mobile)] flex gap-4 overflow-x-auto overflow-y-visible scroll-smooth px-[var(--gutter-mobile)] pb-1 pt-0 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] md:-mx-0 md:px-0 [&::-webkit-scrollbar]:hidden';

export interface ReviewCardCarouselProps {
  reviews: ReviewCardProps[];
}

export const ReviewCardCarousel = ({ reviews }: ReviewCardCarouselProps) => {
  const total = reviews.length;
  const carouselMode = total > 1;

  const {
    trackRef,
    activeIndex,
    scrollToIndex,
    userPaused,
    setUserPaused,
    setHoverPaused,
    progressCycle,
    autoplayActive,
    reducedMotion
  } = useMarketingPeekCarousel({
    itemCount: total,
    carouselMode,
    resetWhen: [reviews.length]
  });

  if (total === 0) return null;

  const itemClass = carouselMode ? CARD_PEEK_CLASS : CARD_STATIC_CLASS;
  const trackClass = carouselMode ? PEEK_TRACK_CLASS : 'flex w-full gap-4 overflow-x-visible pb-1 pt-0';

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className={trackClass}
        aria-label="Member reviews"
        onMouseEnter={() => setHoverPaused(true)}
        onMouseLeave={() => setHoverPaused(false)}
      >
        {reviews.map((review) => (
          <div key={`${review.name}-${review.emirate}`} className={itemClass}>
            <ReviewCard {...review} className="h-full" />
          </div>
        ))}
      </div>

      {carouselMode ? (
        <MarketingCarouselControls
          activeIndex={activeIndex}
          itemCount={total}
          onPrevious={() =>
            scrollToIndex(stepCarouselIndex(activeIndex, total, -1), { bumpProgress: true })
          }
          onNext={() =>
            scrollToIndex(stepCarouselIndex(activeIndex, total, 1), { bumpProgress: true })
          }
          onSelect={(i) => scrollToIndex(i, { bumpProgress: true })}
          previousLabel="Previous review"
          nextLabel="Next review"
          dotsGroupLabel="Review slides"
          dotLabel={(i) => `Review ${i + 1}`}
          userPaused={userPaused}
          onTogglePause={() => setUserPaused((paused) => !paused)}
          showProgressRing={!reducedMotion}
          freezeProgressRing={!autoplayActive}
          progressCycle={progressCycle}
        />
      ) : null}
    </div>
  );
};
