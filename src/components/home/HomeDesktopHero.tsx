import { Link } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { HOME_HERO_IMAGE_JPEG, HOME_HERO_IMAGE_WEBP } from '../../config/seo';
import { HOME_HERO_EYEBROW, HOME_HERO_HEADLINE, HOME_HERO_JOIN_CTA_DESKTOP, HOME_HERO_PRIMARY_CTA_DESKTOP, HOME_HERO_SUBLINE } from '../../content/homeLanding';
import { EXPLORE_MAP_PATH } from '../../config/platform';
import { AppButtonLink } from '../mobile/AppButton';

interface HomeDesktopHeroProps {
  joinHref: string;
  signInHref: string;
}

export const HomeDesktopHero = ({ joinHref, signInHref }: HomeDesktopHeroProps) => (
  <div className="relative hidden overflow-hidden md:block md:min-h-[540px] lg:min-h-[580px]">
    <picture className="absolute inset-0">
      <source srcSet={HOME_HERO_IMAGE_WEBP} type="image/webp" />
      <img
        src={HOME_HERO_IMAGE_JPEG}
        alt=""
        decoding="async"
        fetchPriority="high"
        className="landing-hero-image"
      />
    </picture>
    <div className="landing-hero-overlay-r" />
    <div className="landing-hero-overlay-t" />

    <div className="relative mx-auto flex min-h-[540px] max-w-7xl flex-col px-8 lg:min-h-[580px] lg:px-12">
      <header className="flex shrink-0 items-center justify-between py-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-lg shadow-emerald-900/30">
            <Mountain className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">UAE Trail</span>
        </Link>

        <Link
          to={signInHref}
          className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
        >
          Log in
        </Link>
      </header>

      <div className="flex flex-1 flex-col justify-center pb-14 pt-4 text-white lg:max-w-2xl lg:pb-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/90">{HOME_HERO_EYEBROW}</p>
        <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight lg:text-[3.35rem]">
          {HOME_HERO_HEADLINE}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/90">{HOME_HERO_SUBLINE}</p>

        <div className="landing-hero-desktop-ctas mt-9">
          <AppButtonLink to={EXPLORE_MAP_PATH} className="landing-hero-btn shadow-lg shadow-black/25">
            {HOME_HERO_PRIMARY_CTA_DESKTOP}
          </AppButtonLink>
          <Link to={joinHref} className="ios-btn landing-hero-btn landing-hero-btn-secondary">
            {HOME_HERO_JOIN_CTA_DESKTOP}
          </Link>
        </div>
      </div>
    </div>
  </div>
);
