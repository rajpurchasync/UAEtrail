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
  <section className="landing-close">
    <LandingShell className="md:text-center">
      <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{HOME_CLOSE_HEADLINE}</h2>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/80 md:mx-auto">{HOME_CLOSE_SUBLINE}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row md:justify-center">
        <AppButtonLink to={EXPLORE_MAP_PATH} variant="inverse" className="md:min-w-[11rem]">
          Browse the map
        </AppButtonLink>
        <AppButtonLink
          to={joinHref}
          className="border border-white/25 bg-white/10 text-white shadow-none backdrop-blur-sm md:min-w-[11rem]"
        >
          Join free
        </AppButtonLink>
      </div>
      <Link
        to={EXPLORE_MAP_PATH}
        className="landing-text-cta landing-text-cta--on-dark mt-4 inline-flex items-center gap-1 md:mx-auto"
      >
        Or jump straight to this week&apos;s activities
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </LandingShell>
  </section>
);
