import { Link } from 'react-router-dom';
import { EXPLORE_MAP_PATH } from '../../../../config/routingCatalog';
import { HOME_FINAL_CTA } from '../../../../content/homeMarketing';
import { AppButtonLink } from '../../../mobile/AppButton';

interface HomeFinalCtaSectionProps {
  joinHref: string;
}

export const HomeFinalCtaSection = ({ joinHref }: HomeFinalCtaSectionProps) => (
  <section className="landing-close text-white">
    <div className="mx-auto max-w-[var(--content-max-width)] px-[var(--gutter-mobile)] text-center md:px-[var(--gutter-desktop)]">
      <h2 className="text-xl font-bold tracking-tight md:text-3xl">{HOME_FINAL_CTA.headline}</h2>
      <p className="mx-auto mt-2 max-w-lg text-[13px] leading-snug text-white/80 md:mt-3 md:text-base md:leading-relaxed">
        {HOME_FINAL_CTA.subcopy}
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row md:mt-8 md:justify-center md:gap-3">
        <AppButtonLink
          to={EXPLORE_MAP_PATH}
          variant="inverse"
          className="min-h-11 py-2.5 text-sm md:min-h-[var(--touch-min)] md:min-w-[11rem] md:text-[15px]"
        >
          {HOME_FINAL_CTA.primaryCta}
        </AppButtonLink>
        <AppButtonLink
          to={joinHref}
          className="ios-btn min-h-11 border border-white/25 bg-white/10 py-2.5 text-sm text-white shadow-none backdrop-blur-sm md:min-h-[var(--touch-min)] md:min-w-[11rem] md:text-[15px]"
        >
          {HOME_FINAL_CTA.secondaryCta}
        </AppButtonLink>
      </div>
      <Link to={EXPLORE_MAP_PATH} className="landing-text-cta landing-text-cta--on-dark mx-auto mt-4 inline-flex md:mt-5">
        {HOME_FINAL_CTA.liveLink}
      </Link>
      <div className="mx-auto mt-10 max-w-md border-t border-white/20 pt-8">
        <p className="text-[13px] italic text-white/90 md:text-sm">
          &ldquo;{HOME_FINAL_CTA.founderQuote}&rdquo; – {HOME_FINAL_CTA.founderName}, {HOME_FINAL_CTA.founderRole}
        </p>
      </div>
    </div>
  </section>
);
