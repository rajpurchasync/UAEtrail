import { Link } from 'react-router-dom';
import { EXPLORE_MAP_PATH } from '../../../../config/routingCatalog';
import { HOME_HERO } from '../../../../content/homeMarketing';
import { buildHeroSlides } from '../../../../utils/buildHeroSlides';
import { AppButtonLink } from '../../../mobile/AppButton';
import { HeroCarousel } from '../HeroCarousel';

interface HomeHeroSectionProps {
  joinHref: string;
}

export const HomeHeroSection = ({ joinHref }: HomeHeroSectionProps) => {
  const slides = buildHeroSlides();

  return (
    <HeroCarousel slides={slides}>
      <div
        className="mx-auto flex min-h-0 w-full max-w-[var(--content-max-width)] flex-1 flex-col justify-center px-[var(--gutter-mobile)] pb-[calc(var(--space-6)+env(safe-area-inset-bottom,0px))] pt-[calc(var(--header-height-mobile)+var(--space-4))] md:px-[var(--gutter-desktop)] md:pb-[var(--space-12)] md:pt-[calc(var(--header-height-desktop)+var(--space-8))] lg:pb-[var(--space-16)]"
      >
        <div className="w-full md:max-w-2xl">
          <div className="home-hero-copy flex min-w-0 w-full flex-col gap-6 text-white max-md:gap-10 md:gap-9 md:text-left lg:gap-10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200/90 md:text-[13px] md:tracking-[0.18em]">
              <span className="md:hidden">{HOME_HERO.eyebrowShort}</span>
              <span className="hidden md:inline">{HOME_HERO.eyebrow}</span>
            </p>

            <h1 className="landing-hero-headline leading-[1.28] md:text-[2.75rem] md:leading-[1.18] lg:text-[3.35rem] lg:leading-[1.14]">
              {HOME_HERO.headline}
            </h1>

            <p className="home-hero-intro max-w-xl text-base leading-[1.7] text-white/90 md:text-lg md:leading-[1.65]">
              {HOME_HERO.subcopy}
            </p>

            <div className="landing-hero-desktop-ctas flex w-full flex-row gap-3 max-md:pt-1 md:gap-4 md:pt-2 lg:pt-4">
              <AppButtonLink
                to={EXPLORE_MAP_PATH}
                className="landing-hero-btn min-w-0 flex-1 shadow-lg shadow-black/25 md:flex-none"
              >
                {HOME_HERO.primaryCta}
              </AppButtonLink>
              <Link
                id="home-hero-signup-cta"
                to={joinHref}
                className="ios-btn landing-hero-btn landing-hero-join-cta landing-hero-btn-secondary min-w-0 flex-1 text-center md:w-auto md:flex-none"
              >
                {HOME_HERO.secondaryCta}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </HeroCarousel>
  );
};
