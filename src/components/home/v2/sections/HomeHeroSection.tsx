import { Link } from 'react-router-dom';
import { EXPLORE_MAP_PATH } from '../../../../config/routingCatalog';
import { HOME_HERO } from '../../../../content/homeMarketing';
import { buildHeroSlides } from '../../../../utils/buildHeroSlides';
import { AppButtonLink } from '../../../mobile/AppButton';
import { HeroCarousel } from '../HeroCarousel';
import { ProofPoint } from '../ProofPoint';

interface HomeHeroSectionProps {
  joinHref: string;
}

export const HomeHeroSection = ({ joinHref }: HomeHeroSectionProps) => {
  const slides = buildHeroSlides();

  return (
    <HeroCarousel slides={slides}>
      <div
        className="mx-auto flex min-h-0 w-full max-w-[var(--content-max-width)] flex-1 flex-col justify-center px-[var(--gutter-mobile)] pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] pt-[calc(var(--header-height-mobile)+var(--space-4))] md:px-[var(--gutter-desktop)] md:pb-[var(--space-8)] md:pt-[calc(var(--header-height-desktop)+var(--space-4))]"
      >
        <div className="w-full md:max-w-2xl">
          <div className="home-hero-copy flex min-w-0 w-full flex-col gap-4 text-white max-md:gap-7 md:gap-4 md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200/90 md:tracking-[0.18em]">
              <span className="md:hidden">{HOME_HERO.eyebrowShort}</span>
              <span className="hidden md:inline">{HOME_HERO.eyebrow}</span>
            </p>

            <h1 className="landing-hero-headline leading-[1.12] md:text-[2.75rem] lg:text-[3.35rem]">
              {HOME_HERO.headline}
            </h1>

            <p className="max-w-lg text-[15px] leading-[1.55] text-white/90 md:text-base md:leading-relaxed">
              {HOME_HERO.subcopy}
            </p>

            <ul
              className="grid w-full grid-cols-3 gap-2 max-md:gap-x-2 max-md:gap-y-2.5 max-md:py-0.5 md:flex md:flex-wrap md:gap-2 md:py-0"
              aria-label="Why UAE Trail"
            >
              {HOME_HERO.proofPoints.map((label) => (
                <li key={label} className="flex min-w-0 justify-center md:justify-start">
                  <ProofPoint
                    label={label}
                    className="max-md:w-full max-md:justify-center max-md:px-1.5 max-md:text-center max-md:text-xs"
                  />
                </li>
              ))}
            </ul>

            <div className="landing-hero-desktop-ctas flex w-full flex-row gap-2 max-md:pt-1 md:gap-3 md:pt-0">
              <AppButtonLink
                to={EXPLORE_MAP_PATH}
                className="landing-hero-btn min-w-0 flex-1 shadow-lg shadow-black/25 md:flex-none"
              >
                {HOME_HERO.primaryCta}
              </AppButtonLink>
              <Link
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
