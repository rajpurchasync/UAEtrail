import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { EXPLORE_MAP_PATH } from '../../config/platform';
import { HOME_CLOSE_HEADLINE, HOME_CLOSE_SUBLINE } from '../../content/homeLanding';
import { AppButtonLink } from '../mobile/AppButton';
import { LandingShell } from './LandingShell';

interface HomeMarketingCloseProps {
  joinHref: string;
}

export const HomeMarketingClose = ({ joinHref }: HomeMarketingCloseProps) => (
  <section className="landing-close py-8 md:py-14">
    <LandingShell className="text-center md:text-center">
      <h2 className="text-xl font-bold tracking-tight text-white md:text-3xl">{HOME_CLOSE_HEADLINE}</h2>
      <p className="mt-2 max-w-lg text-[13px] leading-snug text-white/80 md:mx-auto md:mt-3 md:text-base md:leading-relaxed">
        {HOME_CLOSE_SUBLINE}
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row md:mt-8 md:justify-center md:gap-3">
        <AppButtonLink
          to={EXPLORE_MAP_PATH}
          variant="inverse"
          className="min-h-11 py-2.5 text-sm md:min-h-[var(--touch-min)] md:min-w-[11rem] md:text-[15px]"
        >
          Explore the map
        </AppButtonLink>
        <AppButtonLink
          to={joinHref}
          className="min-h-11 border border-white/25 bg-white/10 py-2.5 text-sm text-white shadow-none backdrop-blur-sm md:min-h-[var(--touch-min)] md:min-w-[11rem] md:text-[15px]"
        >
          Join free
        </AppButtonLink>
      </div>
      <Link
        to={EXPLORE_MAP_PATH}
        className="landing-text-cta landing-text-cta--on-dark mx-auto mt-4 inline-flex items-center gap-1 md:mt-5"
      >
        See what&apos;s live on the map this week
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </LandingShell>
  </section>
);
