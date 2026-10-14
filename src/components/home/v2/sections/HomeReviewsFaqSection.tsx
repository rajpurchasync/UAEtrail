import { Link } from 'react-router-dom';
import { HOME_FAQ, HOME_REVIEWS } from '../../../../content/homeMarketing';
import { FaqAccordion } from '../FaqAccordion';
import { SectionHeader } from '../SectionHeader';
import { ReviewCardCarousel } from '../ReviewCardCarousel';

const reviewItems = [
  HOME_REVIEWS.featured,
  ...HOME_REVIEWS.compact
].map((item) => ({
  quote: item.quote,
  name: item.name,
  emirate: item.emirate
}));

export const HomeReviewsFaqSection = () => (
  <>
    <section
      className="bg-home-green-50/40 py-[var(--section-padding-y-mobile)] md:py-[var(--section-padding-y-desktop)]"
      aria-labelledby="home-reviews-heading"
    >
      <div className="home-marketing-wrap">
        <SectionHeader id="home-reviews-heading" title={HOME_REVIEWS.title} />
        <div className="overflow-visible pt-1">
          <ReviewCardCarousel reviews={reviewItems} />
        </div>
      </div>
    </section>

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
