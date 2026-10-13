import { Gift, ShieldCheck, Users } from 'lucide-react';
import { EXPLORE_MAP_PATH } from '../../../../config/routingCatalog';
import { HOME_HERO } from '../../../../content/homeMarketing';
import { buildHeroSlides } from '../../../../utils/buildHeroSlides';
import { AppButtonLink } from '../../../mobile/AppButton';
import { HeroCarousel } from '../HeroCarousel';

const HERO_FEATURE_ICONS = {
  verified: ShieldCheck,
  together: Users,
  free: Gift
} as const;

/** Mobile chips — short labels only (unchanged from pre-desktop pass). */
const MOBILE_CHIP_LABEL: Record<(typeof HOME_HERO.features)[number]['id'], string> = {
  verified: 'Verified',
  together: 'Go together',
  free: 'Free to join'
};

export const HomeHeroSection = () => {
  const slides = buildHeroSlides();

  return (
    <HeroCarousel slides={slides}>
      <div
        className="home-marketing-wrap pb-[var(--space-4)] pt-[calc(var(--header-height-mobile)+var(--space-8))] md:pb-[var(--space-6)] md:pt-[calc(var(--header-height-desktop)+var(--space-12))]"
      >
        <div className="mx-auto w-full max-w-2xl md:max-w-none">
          <div className="home-hero-copy flex min-w-0 w-full flex-col items-center gap-6 text-center text-white md:items-start md:gap-7 md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200/90 md:text-[13px] md:tracking-[0.18em]">
              <span className="md:hidden">{HOME_HERO.eyebrowShort}</span>
              <span className="hidden md:inline">{HOME_HERO.eyebrow}</span>
            </p>

            <h1 className="landing-hero-headline font-black leading-[1.18] md:max-w-3xl md:text-[3.15rem] md:leading-[1.1] lg:max-w-4xl lg:text-[3.85rem] lg:leading-[1.06]">
              {HOME_HERO.headline}
            </h1>

            <p className="home-hero-intro max-w-md text-sm leading-snug text-white/85 md:hidden">
              {HOME_HERO.subcopy}
            </p>
            <p
              className="home-hero-intro hidden max-w-2xl text-[0.9375rem] leading-relaxed text-white/88 md:block lg:max-w-3xl lg:text-base lg:leading-relaxed"
            >
              {HOME_HERO.subcopyDesktop}
            </p>

            <div className="landing-hero-desktop-ctas flex w-full justify-center md:my-10 md:justify-start lg:my-12">
              <AppButtonLink
                to={EXPLORE_MAP_PATH}
                className="landing-hero-btn w-full max-w-[20rem] px-8 shadow-lg shadow-black/25 md:min-h-12 md:w-auto md:min-w-[17.5rem] md:max-w-[20rem] md:px-10 md:text-base"
              >
                {HOME_HERO.primaryCta}
              </AppButtonLink>
            </div>

            {/* Mobile — centered icon chips, label only */}
            <ul
              className="flex w-full max-w-lg items-stretch justify-center gap-2.5 sm:gap-3 md:hidden"
              aria-label="Why UAE Trail"
            >
              {HOME_HERO.features.map((feature) => {
                const Icon = HERO_FEATURE_ICONS[feature.id];
                return (
                  <li
                    key={feature.id}
                    className="home-hero-proof-chip flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-center sm:px-2.5 sm:py-2.5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center" aria-hidden>
                      <Icon className="h-[18px] w-[18px] text-emerald-200/95" strokeWidth={2.25} />
                    </span>
                    <span className="text-[11px] font-semibold leading-tight tracking-tight text-white/92 [text-shadow:0_1px_8px_rgba(0,0,0,0.35)] sm:text-xs">
                      {MOBILE_CHIP_LABEL[feature.id]}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* Desktop — three equal columns with icon, title, description */}
            <ul
              className="hidden w-full grid-cols-3 gap-4 md:grid lg:gap-5"
              aria-label="Why UAE Trail"
            >
              {HOME_HERO.features.map((feature) => {
                const Icon = HERO_FEATURE_ICONS[feature.id];
                return (
                  <li
                    key={feature.id}
                    className="home-hero-proof-chip flex min-w-0 items-center gap-3 rounded-xl p-3.5 text-left lg:gap-3.5 lg:p-4"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center lg:h-14 lg:w-14" aria-hidden>
                      <Icon className="h-6 w-6 text-emerald-200/95 lg:h-7 lg:w-7" strokeWidth={2.25} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold leading-tight text-white/95 [text-shadow:0_1px_10px_rgba(0,0,0,0.4)]">
                        {feature.label}
                        {'labelFootnote' in feature && feature.labelFootnote ? (
                          <span aria-hidden="true">{feature.labelFootnote}</span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs leading-snug text-white/78 lg:text-[13px] lg:leading-relaxed">
                        {feature.detail}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </HeroCarousel>
  );
};
