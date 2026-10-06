import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EXPLORE_MAP_PATH } from '../../../../config/routingCatalog';
import type { HomeLandingActivity } from '../../../../content/homeLanding';
import { HOME_HERO } from '../../../../content/homeMarketing';
import { buildHeroSlides } from '../../../../utils/buildHeroSlides';
import { formatActivityTime } from '../../../../utils/formatActivityTime';
import { AppButtonLink } from '../../../mobile/AppButton';
import { HeroCarousel } from '../HeroCarousel';
import { ProofPoint } from '../ProofPoint';

interface HomeHeroSectionProps {
  joinHref: string;
  activities: HomeLandingActivity[];
}

export const HomeHeroSection = ({ joinHref, activities }: HomeHeroSectionProps) => {
  const slides = useMemo(() => buildHeroSlides(activities), [activities]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [slides]);
  const slide = slides[activeIndex] ?? slides[0];

  return (
    <HeroCarousel slides={slides} onActiveIndexChange={setActiveIndex}>
      <div
        className="mx-auto w-full max-w-[var(--content-max-width)] px-[var(--gutter-mobile)] pb-14 pt-[calc(var(--header-height-mobile)+var(--space-3))] md:px-[var(--gutter-desktop)] md:pb-[var(--space-8)] md:pt-[calc(var(--header-height-desktop)+var(--space-4))]"
      >
        <div
          className="grid grid-cols-1 items-center justify-items-center gap-5 max-md:gap-6 md:items-end md:justify-items-stretch md:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] md:gap-8 lg:grid-cols-[minmax(0,560px)_minmax(240px,300px)] lg:gap-10"
        >
          <div className="home-hero-copy flex min-w-0 w-full flex-col gap-4 text-white max-md:order-1 md:gap-4 md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200/90 md:tracking-[0.18em]">
              <span className="md:hidden">{HOME_HERO.eyebrowShort}</span>
              <span className="hidden md:inline">{HOME_HERO.eyebrow}</span>
            </p>

            <h1 className="landing-hero-headline leading-[1.12] md:text-[2.75rem] lg:text-[3.35rem]">
              {HOME_HERO.headline}
            </h1>

            <p className="max-w-lg text-[15px] leading-relaxed text-white/90 md:text-base">
              {HOME_HERO.subcopy}
            </p>

            <ul
              className="grid w-full grid-cols-3 gap-1.5 max-md:gap-2 md:flex md:flex-wrap md:gap-2"
              aria-label="Why UAE Trail"
            >
              {HOME_HERO.proofPoints.map((label) => (
                <li key={label} className="flex min-w-0 justify-center md:justify-start">
                  <ProofPoint label={label} className="max-md:w-full max-md:justify-center max-md:px-1.5 max-md:text-center max-md:text-xs" />
                </li>
              ))}
            </ul>

            <div className="landing-hero-desktop-ctas flex w-full flex-row gap-2 md:gap-3">
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

          {slide ? (
            <Link
              to={slide.href}
              className="home-focus-ring group block w-full max-w-[14.5rem] rounded-xl border border-white/15 bg-black/45 p-3 text-left text-white shadow-lg backdrop-blur-md transition hover:border-white/25 hover:bg-black/55 md:max-w-none md:rounded-2xl md:p-4 max-md:order-3"
            >
              <p className="line-clamp-2 text-[13px] font-semibold leading-snug md:text-base">
                {slide.title}
              </p>
              <p className="mt-1 text-xs text-white/85 md:mt-1.5 md:text-[13px]">
                {slide.emirate} · {formatActivityTime(slide.startsAt)}
              </p>
              <p className="mt-1.5 text-xs font-medium text-emerald-100 md:mt-2 md:text-[13px]">{slide.priceLabel}</p>
              <span
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white/80 group-hover:text-white md:mt-3"
              >
                View plan
                <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </HeroCarousel>
  );
};
