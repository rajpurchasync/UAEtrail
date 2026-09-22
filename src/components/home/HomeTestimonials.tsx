import { Star } from 'lucide-react';
import { LandingSectionIntro } from './LandingSectionIntro';
import { LandingShell } from './LandingShell';
import { HOME_TESTIMONIALS_SECTION, testimonialInitials } from '../../content/homeLanding';

export interface HomeTestimonial {
  name: string;
  location: string;
  rating: number;
  text: string;
}

interface HomeTestimonialsProps {
  items: readonly HomeTestimonial[];
}

const AVATAR_COLORS = ['bg-emerald-700', 'bg-neutral-800', 'bg-emerald-900', 'bg-neutral-700'] as const;

const Stars = ({ rating }: { rating: number }) => (
  <div className="flex justify-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}`}
        aria-hidden
      />
    ))}
  </div>
);

export const HomeTestimonials = ({ items }: HomeTestimonialsProps) => {
  if (items.length === 0) return null;

  const [featured, ...rest] = items;

  return (
    <section className="border-b border-neutral-100 bg-white py-6 md:py-14" aria-label="Member stories">
      <LandingShell>
        <LandingSectionIntro
          title={HOME_TESTIMONIALS_SECTION.title}
          subtitle={HOME_TESTIMONIALS_SECTION.subtitle}
          mobileSubtitleHidden
          className="max-w-xl md:mx-auto md:text-center"
        />

        <figure className="mx-auto mt-5 max-w-3xl rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/90 to-white p-5 text-center md:mt-8 md:p-8">
          <Stars rating={featured.rating} />
          <blockquote className="mt-3 text-[15px] font-medium leading-relaxed text-neutral-800 md:mt-4 md:text-xl md:leading-snug">
            &ldquo;{featured.text}&rdquo;
          </blockquote>
          <figcaption className="mt-4 flex items-center justify-center gap-3 md:mt-5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${AVATAR_COLORS[0]}`}
              aria-hidden
            >
              {testimonialInitials(featured.name)}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-neutral-900">{featured.name}</p>
              <p className="text-xs text-neutral-500">{featured.location}</p>
            </div>
          </figcaption>
        </figure>

        {rest.length > 0 ? (
          <ul className="mt-4 hidden gap-4 md:mt-8 md:grid md:grid-cols-3 md:gap-5">
            {rest.slice(0, 3).map((item, index) => (
              <li
                key={item.name}
                className="rounded-2xl border border-neutral-100 bg-neutral-50/60 p-5 md:bg-white md:shadow-sm md:ring-1 md:ring-black/[0.04]"
              >
                <Stars rating={item.rating} />
                <blockquote className="mt-3 text-[14px] leading-relaxed text-neutral-700">
                  &ldquo;{item.text}&rdquo;
                </blockquote>
                <div className="mt-4 flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${AVATAR_COLORS[(index + 1) % AVATAR_COLORS.length]}`}
                    aria-hidden
                  >
                    {testimonialInitials(item.name)}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-neutral-900">{item.name}</p>
                    <p className="text-[11px] text-neutral-500">{item.location}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </LandingShell>
    </section>
  );
};
