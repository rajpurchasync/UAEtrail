import { Link } from 'react-router-dom';
import { HOME_FAQ, HOME_REVIEWS } from '../../../../content/homeMarketing';
import { FaqAccordion, SectionHeader } from '../index';
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
  <section
    className="bg-home-green-50/40 py-[var(--section-padding-y-mobile)] md:py-[var(--section-padding-y-desktop)]"
    aria-labelledby="home-reviews-heading"
  >
    <div className="mx-auto max-w-[var(--content-max-width)] px-[var(--gutter-mobile)] md:px-[var(--gutter-desktop)]">
      <SectionHeader id="home-reviews-heading" title={HOME_REVIEWS.title} />
      <div className="overflow-visible pt-1">
        <ReviewCardCarousel reviews={reviewItems} />
      </div>

      <div className="mt-8 border-t border-[var(--gray-200)]/70 pt-8 md:mt-10 md:pt-9">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[1.125rem] font-bold tracking-tight text-neutral-900 md:text-[1.375rem]">
            {HOME_FAQ.title}
          </h3>
          <Link to="/faq" className="landing-text-cta shrink-0">
            {HOME_FAQ.allLink}
          </Link>
        </div>
        <FaqAccordion items={[...HOME_FAQ.items]} />
      </div>
    </div>
  </section>
);
