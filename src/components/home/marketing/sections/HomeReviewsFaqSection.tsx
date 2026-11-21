import { Link } from 'react-router-dom';
import { HOME_FAQ, HOME_REVIEWS } from '../../../../content/homeMarketing';
import { useHomeMarketingReviews } from '../../../../hooks/useHomeMarketingReviews';
import { FaqAccordion } from '../FaqAccordion';
import { SectionHeader } from '../SectionHeader';
import { ReviewCardCarousel } from '../ReviewCardCarousel';

export const HomeReviewsFaqSection = () => {
  const { reviews, loading } = useHomeMarketingReviews();
  const showReviews = loading || reviews.length > 0;

  return (
  <>
    {showReviews ? (
    <section
      className="bg-home-green-50/40 py-[var(--section-padding-y-mobile)] md:py-[var(--section-padding-y-desktop)]"
      aria-labelledby="home-reviews-heading"
    >
      <div className="home-marketing-wrap">
        <SectionHeader id="home-reviews-heading" title={HOME_REVIEWS.title} />
        <p className="mb-4 max-w-2xl text-sm text-neutral-600">
          {reviews.length > 0 ? HOME_REVIEWS.liveDisclosure : HOME_REVIEWS.loadingDisclosure}
        </p>
        <div className="overflow-visible pt-1">
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2" aria-busy="true">
              {[0, 1].map((key) => (
                <div key={key} className="h-36 animate-pulse rounded-2xl bg-neutral-200/70" />
              ))}
            </div>
          ) : (
            <ReviewCardCarousel reviews={reviews} />
          )}
        </div>
      </div>
    </section>
    ) : null}

    <section
      className="bg-home-surface py-[var(--section-padding-y-mobile)] md:py-[var(--section-padding-y-desktop)]"
      aria-labelledby="home-faq-heading"
    >
      <div className="home-marketing-wrap">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="home-faq-heading"
            className="landing-section-title"
          >
            {HOME_FAQ.title}
          </h2>
          <Link to="/faq" className="landing-text-cta shrink-0">
            {HOME_FAQ.allLink}
          </Link>
        </div>
        <FaqAccordion items={[...HOME_FAQ.items]} />
      </div>
    </section>
  </>
  );
};
