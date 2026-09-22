import { Link } from 'react-router-dom';
import { EXPLORE_MAP_PATH } from '../../config/platform';
import { HOME_HERO_IMAGE_JPEG, HOME_HERO_IMAGE_WEBP } from '../../config/seo';
import { HOME_HERO_JOIN_CTA, HOME_HERO_JOIN_PROMPT, HOME_HERO_SUBLINE } from '../../content/homeLanding';
import { AppButtonLink } from '../mobile/AppButton';
import { MobileBrandBar } from '../layout/MobileBrandBar';
import { LandingShell } from './LandingShell';

interface HomeMobileLaunchProps {
  joinHref: string;
}

export const HomeMobileLaunch = ({ joinHref }: HomeMobileLaunchProps) => (
  <section className="home-launch relative overflow-hidden md:hidden" aria-label="Welcome">
    <picture className="absolute inset-0">
      <source srcSet={HOME_HERO_IMAGE_WEBP} type="image/webp" />
      <img
        src={HOME_HERO_IMAGE_JPEG}
        alt=""
        decoding="async"
        className="home-launch-hero h-full w-full object-cover object-[center_38%]"
      />
    </picture>
    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/80" />
    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/75 to-transparent" />

    <LandingShell className="landing-hero-frame relative z-10 pt-safe-plus-2">
      <MobileBrandBar tone="light" menuVariant="user" />

      <div className="landing-hero-copy mt-5 flex flex-col items-center gap-5 text-center">
        <div className="space-y-2.5">
          <h1 className="text-[1.625rem] font-bold leading-[1.15] tracking-tight text-white">
            Find hiking &amp; camping buddies in the UAE
          </h1>
          <p className="mx-auto max-w-[21rem] text-[14px] leading-[1.45] text-white/90">
            {HOME_HERO_SUBLINE}
          </p>
        </div>

        <div className="flex w-full max-w-[19rem] flex-col items-center gap-3">
          <AppButtonLink to={EXPLORE_MAP_PATH} fullWidth className="shadow-lg shadow-black/25">
            Browse the map
          </AppButtonLink>
          <p className="text-[13px] leading-snug text-white/80">
            {HOME_HERO_JOIN_PROMPT}{' '}
            <Link to={joinHref} className="font-semibold text-white underline underline-offset-2">
              {HOME_HERO_JOIN_CTA}
            </Link>
          </p>
        </div>
      </div>
    </LandingShell>
  </section>
);
