import type React from 'react';
import { Link } from 'react-router-dom';
import { EXPLORE_MAP_PATH } from '../../config/platform';
import { HOME_HERO_IMAGE_JPEG, HOME_HERO_IMAGE_WEBP } from '../../config/seo';
import {
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

/**
 * Guest mobile hero — min height from viewport; grows if copy/CTAs need room (large text, small screens).
 * See docs/LANDING.md § Responsive rules.
 */
export const HomeMobileLaunch = ({ joinHref }: HomeMobileLaunchProps) => (
  <section className="home-launch relative overflow-x-clip md:hidden" aria-label="Welcome">
    <picture className="pointer-events-none absolute inset-0">
      <source srcSet={HOME_HERO_IMAGE_WEBP} type="image/webp" />
      <img
        src={HOME_HERO_IMAGE_JPEG}
        alt=""
        decoding="async"
        className="landing-hero-image"
        {...({ fetchpriority: 'high' } as React.ImgHTMLAttributes<HTMLImageElement>)}
      />
    </picture>
    <div className="landing-hero-overlay-r pointer-events-none" aria-hidden />
    <div className="landing-hero-overlay-t pointer-events-none" aria-hidden />

    <LandingShell className="landing-hero-frame home-launch-frame relative z-10 text-white">
      <div className="home-launch-grid">
        <MobileBrandBar tone="light" menuVariant="user" className="home-launch-chrome shrink-0" />

        <div className="home-launch-panel">
          <div className="home-launch-copy-block text-center">
            <h1 className="home-launch-headline">{HOME_HERO_HEADLINE}</h1>
            <p className="home-launch-subline">{HOME_HERO_SUBLINE_MOBILE}</p>
          </div>

          <div className="home-launch-actions">
            <AppButtonLink to={EXPLORE_MAP_PATH} className="home-launch-cta">
              {HOME_HERO_PRIMARY_CTA}
            </AppButtonLink>
            <Link to={joinHref} className="home-launch-join">
              {HOME_HERO_JOIN_CTA}
            </Link>
          </div>
        </div>
      </div>
    </LandingShell>
  </section>
);
