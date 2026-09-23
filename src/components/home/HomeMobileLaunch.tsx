import { Link } from 'react-router-dom';
import { EXPLORE_MAP_PATH } from '../../config/platform';
import { HOME_HERO_IMAGE_JPEG, HOME_HERO_IMAGE_WEBP } from '../../config/seo';
import {
  HOME_HERO_EYEBROW_MOBILE,
  HOME_HERO_HEADLINE,
  HOME_HERO_JOIN_CTA,
  HOME_HERO_PRIMARY_CTA,
  HOME_HERO_SUBLINE_MOBILE,
} from '../../content/homeLanding';
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
      <img src={HOME_HERO_IMAGE_JPEG} alt="" decoding="async" className="landing-hero-image" />
    </picture>
    <div className="landing-hero-overlay-r" />
    <div className="landing-hero-overlay-t" />
    <div className="landing-hero-overlay-mobile" aria-hidden />

    <LandingShell className="landing-hero-frame relative z-10 pt-safe-plus-2 text-white">
      <MobileBrandBar tone="light" menuVariant="user" />

      <div className="landing-hero-copy">
        <div className="landing-hero-content mx-auto w-full max-w-[17.5rem] xs:max-w-[18.5rem]">
          <div className="space-y-2.5 text-center">
            <p className="landing-hero-eyebrow text-emerald-200/90">{HOME_HERO_EYEBROW_MOBILE}</p>
            <h1 className="text-[1.4375rem] font-bold leading-[1.15] tracking-tight xs:text-[1.5rem]">
              {HOME_HERO_HEADLINE}
            </h1>
            <p className="text-[13px] leading-relaxed text-white/90">{HOME_HERO_SUBLINE_MOBILE}</p>
          </div>

          <div className="landing-hero-actions mt-5">
            <AppButtonLink to={EXPLORE_MAP_PATH} className="landing-hero-btn shadow-lg shadow-black/25">
              {HOME_HERO_PRIMARY_CTA}
            </AppButtonLink>
            <Link
              to={joinHref}
              className="text-[13px] font-semibold text-white underline underline-offset-2"
            >
              {HOME_HERO_JOIN_CTA}
            </Link>
          </div>
        </div>
      </div>
    </LandingShell>
  </section>
);
