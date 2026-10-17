import { useRef } from 'react';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { stepCarouselIndex } from '../../../utils/heroCarouselState';
import { ReviewCard, type ReviewCardProps } from './ReviewCard';
import { MarketingCarouselControls } from './MarketingCarouselControls';
import { useMarketingAdaptiveOverflow } from './useMarketingAdaptiveOverflow';
import { useMarketingPeekCarousel } from './useMarketingPeekCarousel';

const CARD_PEEK_CLASS =
  'w-[min(88vw,22rem)] shrink-0 snap-start scroll-ml-[var(--gutter-mobile)] sm:w-[min(78vw,24rem)]';

const PEEK_TRACK_CLASS =
  '-mx-[var(--gutter-mobile)] flex gap-4 overflow-x-auto overflow-y-visible scroll-smooth px-[var(--gutter-mobile)] pb-1 pt-0 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export interface ReviewCardCarouselProps {
  reviews: ReviewCardProps[];
}

export const ReviewCardCarousel = ({ reviews }: ReviewCardCarouselProps) => {
  const isMobile = useIsMobile();
  const trackRef = useRef<HTMLDivElement>(null);
  const total = reviews.length;
  const multi = total > 1;

  const overflows = useMarketingAdaptiveOverflow(trackRef, !isMobile && multi, [reviews.length]);

  const carouselMode = multi && (isMobile || overflows);

  const {
    activePage,
    pageCount,
    scrollToPage,
    userPaused,
    setUserPaused,
    setHoverPaused,
    progressCycle,
    autoplayActive,
    reducedMotion
  } = useMarketingPeekCarousel({
    itemCount: total,
    carouselMode,
    trackRef,
    resetWhen: [reviews.length, isMobile, overflows]
  });

  if (total === 0) return null;

  const trackClass = isMobile
    ? PEEK_TRACK_CLASS
    : [
        'home-marketing-adaptive-track pb-1 pt-0',
        overflows ? 'home-marketing-adaptive-track--scroll' : 'overflow-x-visible'
      ].join(' ');

  const wrapClass = isMobile ? CARD_PEEK_CLASS : 'home-marketing-adaptive-review-card min-h-0';

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
          <div key={`${review.name}-${review.emirate}`} className={wrapClass}>
            <ReviewCard {...review} className="h-full" />
          </div>
        ))}
      </div>

      {carouselMode ? (
        <MarketingCarouselControls
          activeIndex={activePage}
          itemCount={pageCount}
          onPrevious={() =>
            scrollToPage(stepCarouselIndex(activePage, pageCount, -1), { bumpProgress: true })
          }
          onNext={() =>
            scrollToPage(stepCarouselIndex(activePage, pageCount, 1), { bumpProgress: true })
          }
          onSelect={(i) => scrollToPage(i, { bumpProgress: true })}
          previousLabel="Previous reviews"
          nextLabel="Next reviews"
          dotsGroupLabel="Review pages"
          dotLabel={(i) => `Reviews page ${i + 1} of ${pageCount}`}
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
