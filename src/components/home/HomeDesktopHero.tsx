import { Link } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { HOME_HERO_IMAGE_JPEG, HOME_HERO_IMAGE_WEBP } from '../../config/seo';
import { HOME_HERO_JOIN_CTA, HOME_HERO_JOIN_PROMPT, HOME_HERO_SUBLINE } from '../../content/homeLanding';
import { DESKTOP_NAV_LINKS, EXPLORE_MAP_PATH, MEMBERSHIP_NAV_LINK } from '../../config/platform';
import { AppButtonLink } from '../mobile/AppButton';

interface HomeDesktopHeroProps {
  joinHref: string;
  signInHref: string;
}

export const HomeDesktopHero = ({ joinHref, signInHref }: HomeDesktopHeroProps) => (
  <div className="relative hidden overflow-hidden md:block md:min-h-[480px] lg:min-h-[520px]">
    <picture className="absolute inset-0">
      <source srcSet={HOME_HERO_IMAGE_WEBP} type="image/webp" />
      <img
        src={HOME_HERO_IMAGE_JPEG}
        alt=""
        decoding="async"
        className="home-launch-hero h-full w-full object-cover object-[center_30%]"
      />
    </picture>
    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/82" />

    <div className="relative mx-auto flex min-h-[480px] max-w-7xl flex-col px-8 lg:min-h-[520px] lg:px-12">
      <header className="flex shrink-0 items-center justify-between py-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-lg shadow-emerald-900/30">
            <Mountain className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">UAE Trail</span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-1 backdrop-blur-md lg:flex">
          {[...DESKTOP_NAV_LINKS, ...(MEMBERSHIP_NAV_LINK ? [MEMBERSHIP_NAV_LINK] : [])].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/15"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link to={signInHref} className="text-sm font-medium text-white/85 hover:text-white">
            Log in
          </Link>
          <AppButtonLink to={EXPLORE_MAP_PATH} variant="inverse" className="px-5 shadow-md">
            Browse map
          </AppButtonLink>
        </div>
      </header>

      <div className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center pb-12 pt-2 text-center text-white">
        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-balance lg:text-[3.25rem]">
          Find hiking &amp; camping buddies in the UAE
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/90">{HOME_HERO_SUBLINE}</p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <AppButtonLink to={EXPLORE_MAP_PATH} className="min-h-[3rem] px-10 text-base shadow-lg shadow-black/25">
            Browse the map
          </AppButtonLink>
          <p className="text-[15px] text-white/80">
            {HOME_HERO_JOIN_PROMPT}{' '}
            <Link to={joinHref} className="font-semibold text-white underline underline-offset-2">
              {HOME_HERO_JOIN_CTA}
            </Link>
          </p>
        </div>
      </div>
    </div>
  </div>
);
