import { type ReactNode } from 'react';
import { stepCarouselIndex } from '../../../utils/heroCarouselState';
import type { ActivityCardProps } from './ActivityCard';
import { ActivityCard, ActivityCardSkeleton } from './ActivityCard';
import { MarketingCarouselControls } from './MarketingCarouselControls';
import { useMarketingPeekCarousel } from './useMarketingPeekCarousel';

/** Wide peek cards — horizontal scroll when multiple outings; avoids squeezing into equal columns. */
const CARD_PEEK_CLASS =
  'w-[min(88vw,20rem)] shrink-0 snap-start scroll-ml-[var(--gutter-mobile)] sm:w-[min(72vw,22rem)] md:w-[calc((100%-1rem)/1.9)] md:scroll-ml-0 lg:w-[calc((100%-2rem)/2.15)]';

const CARD_STATIC_CLASS = 'w-full max-w-md mx-auto';

const PEEK_TRACK_CLASS =
  '-mx-[var(--gutter-mobile)] flex gap-4 overflow-x-auto overflow-y-visible scroll-smooth px-[var(--gutter-mobile)] pb-1 pt-0 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] md:-mx-0 md:px-0 [&::-webkit-scrollbar]:hidden';

export interface ActivityCardCarouselProps {
  cards: ActivityCardProps[];
  loading?: boolean;
  skeletonCount?: number;
  emptyState?: ReactNode;
}

export const ActivityCardCarousel = ({
  cards,
  loading = false,
  skeletonCount = 4,
  emptyState
}: ActivityCardCarouselProps) => {
  const itemCount = loading ? skeletonCount : cards.length;
  const carouselMode = itemCount > 1;

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
    itemCount,
    carouselMode,
    resetWhen: [cards.length, loading]
  });

  if (!loading && cards.length === 0 && emptyState) {
    return <div className="py-8 text-center">{emptyState}</div>;
  }

  const itemClass = carouselMode ? CARD_PEEK_CLASS : CARD_STATIC_CLASS;
  const trackClass = carouselMode ? PEEK_TRACK_CLASS : 'flex w-full gap-4 overflow-x-visible pb-1 pt-0';

  return (
    <div className="relative">
      <div
        className={trackClass}
        ref={trackRef}
        aria-label="Activity cards"
        onMouseEnter={() => setHoverPaused(true)}
        onMouseLeave={() => setHoverPaused(false)}
      >
        {loading
          ? Array.from({ length: skeletonCount }, (_, i) => (
              <div key={i} className={itemClass}>
                <ActivityCardSkeleton />
              </div>
            ))
          : cards.map((card) => (
              <div key={card.href + card.title} className={itemClass}>
                <ActivityCard {...card} />
              </div>
            ))}
      </div>

      {carouselMode ? (
        <MarketingCarouselControls
          activeIndex={activeIndex}
          itemCount={itemCount}
          onPrevious={() =>
            scrollToIndex(stepCarouselIndex(activeIndex, itemCount, -1), { bumpProgress: true })
          }
          onNext={() =>
            scrollToIndex(stepCarouselIndex(activeIndex, itemCount, 1), { bumpProgress: true })
          }
          onSelect={(i) => scrollToIndex(i, { bumpProgress: true })}
          previousLabel="Previous activity"
          nextLabel="Next activity"
          dotsGroupLabel="Activity slides"
          dotLabel={(i) => `Go to activity ${i + 1}`}
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
