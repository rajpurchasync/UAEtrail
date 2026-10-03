import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';

import {
  HOME_CLOSE_HEADLINE,
  HOME_CLOSE_SUBLINE,
  HOME_HERO_JOIN_CTA,
  HOME_HERO_PRIMARY_CTA,
} from '../../content/homeLanding';
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
      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center md:mt-8 md:gap-3">
        <AppButtonLink
          to={EXPLORE_MAP_PATH}
          variant="inverse"
          fullWidth
          className="min-h-11 py-2.5 text-sm sm:min-w-[11rem] sm:flex-1 sm:max-w-[14rem] md:min-h-[var(--touch-min)] md:max-w-none md:flex-none md:text-[15px]"
        >
          {HOME_HERO_PRIMARY_CTA}
        </AppButtonLink>
        <AppButtonLink
          to={joinHref}
          fullWidth
          className="landing-close-join min-h-11 border border-white/25 bg-white/10 py-2.5 text-sm text-white shadow-none backdrop-blur-sm hover:bg-white/15 sm:min-w-[11rem] sm:flex-1 sm:max-w-[14rem] md:min-h-[var(--touch-min)] md:max-w-none md:flex-none md:text-[15px]"
        >
          {HOME_HERO_JOIN_CTA}
        </AppButtonLink>
      </div>
    </LandingShell>
  </section>
);
