import { useRef, type ReactNode } from 'react';
import { useHorizontalDragScroll } from '../../../hooks/useHorizontalDragScroll';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { stepCarouselIndex } from '../../../utils/heroCarouselState';
import type { ActivityCardProps } from './ActivityCard';
import { ActivityCard, ActivityCardSkeleton } from './ActivityCard';
import { MarketingCarouselControls } from './MarketingCarouselControls';
import { useMarketingAdaptiveOverflow } from './useMarketingAdaptiveOverflow';
import { useMarketingPeekCarousel } from './useMarketingPeekCarousel';

const CARD_PEEK_CLASS =
  'w-[min(88vw,20rem)] shrink-0 snap-start scroll-ml-[var(--gutter-mobile)] sm:w-[min(72vw,22rem)]';

const PEEK_TRACK_CLASS =
  '-mx-[var(--gutter-mobile)] flex gap-4 overflow-x-auto overflow-y-visible scroll-smooth px-[var(--gutter-mobile)] py-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

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
  const isMobile = useIsMobile();
  const trackRef = useRef<HTMLDivElement>(null);
  useHorizontalDragScroll(trackRef);
  const itemCount = loading ? skeletonCount : cards.length;
  const multi = itemCount > 1;

  const overflows = useMarketingAdaptiveOverflow(trackRef, !isMobile && multi, [
    cards.length,
    loading
  ]);

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
    itemCount,
    carouselMode,
    trackRef,
    resetWhen: [cards.length, loading, isMobile, overflows],
    oneCardPerPage: isMobile
  });

  if (!loading && cards.length === 0 && emptyState) {
    return <div className="py-8 text-center">{emptyState}</div>;
  }

  const trackClass = isMobile
    ? PEEK_TRACK_CLASS
    : [
        'home-marketing-adaptive-track py-1',
        overflows ? 'home-marketing-adaptive-track--scroll' : 'overflow-x-visible'
      ].join(' ');

  const wrapClass = isMobile ? CARD_PEEK_CLASS : 'home-marketing-adaptive-card min-h-0';

  const items = loading
    ? Array.from({ length: skeletonCount }, (_, i) => (
        <div key={i} className={wrapClass}>
          <ActivityCardSkeleton />
        </div>
      ))
    : cards.map((card) => (
        <div key={card.href + card.title} className={wrapClass}>
          <ActivityCard {...card} />
        </div>
      ));

  return (
    <div className="relative">
      <div
        className={trackClass}
        ref={trackRef}
        aria-label="Activity cards"
        onMouseEnter={() => setHoverPaused(true)}
        onMouseLeave={() => setHoverPaused(false)}
      >
        {items}
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
          previousLabel="Previous activities"
          nextLabel="Next activities"
          dotsGroupLabel="Activity pages"
          dotLabel={(i) => `Activities page ${i + 1} of ${pageCount}`}
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
