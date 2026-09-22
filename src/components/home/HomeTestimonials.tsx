import { LandingSectionIntro } from './LandingSectionIntro';
import { LandingShell } from './LandingShell';
import { testimonialInitials } from '../../content/homeLanding';

export interface HomeTestimonial {
  name: string;
  location: string;
  rating: number;
  text: string;
}

interface HomeTestimonialsProps {
  items: readonly HomeTestimonial[];
}

const AVATAR_COLORS = ['bg-emerald-700', 'bg-neutral-800'] as const;

export const HomeTestimonials = ({ items }: HomeTestimonialsProps) => {
  const [featured, secondary] = items;

  if (!featured) return null;

  return (
    <section className="border-t border-neutral-100 py-8 md:py-14">
      <LandingShell>
        <LandingSectionIntro title="What hikers are saying" />

        <figure className="mt-6 max-w-2xl md:mt-8">
          <blockquote className="text-[1.125rem] font-medium leading-relaxed text-neutral-800 md:text-[1.35rem] md:leading-snug">
            &ldquo;{featured.text}&rdquo;
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${AVATAR_COLORS[0]}`}
              aria-hidden
            >
              {testimonialInitials(featured.name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">{featured.name}</p>
              <p className="text-xs text-neutral-500">{featured.location}</p>
            </div>
          </figcaption>
        </figure>

        {secondary ? (
          <figure className="mt-6 rounded-2xl border border-neutral-100 bg-neutral-50/80 p-4 md:mt-8 md:p-5">
            <blockquote className="text-[14px] leading-relaxed text-neutral-700">
              &ldquo;{secondary.text}&rdquo;
            </blockquote>
            <figcaption className="mt-3 flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${AVATAR_COLORS[1]}`}
                aria-hidden
              >
                {testimonialInitials(secondary.name)}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-neutral-900">{secondary.name}</p>
                <p className="text-[11px] text-neutral-500">{secondary.location}</p>
              </div>
            </figcaption>
          </figure>
        ) : null}
      </LandingShell>
    </section>
  );
};
