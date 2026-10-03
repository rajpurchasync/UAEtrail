import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import type React from 'react';

import { HOME_HERO_IMAGE_JPEG, HOME_HERO_IMAGE_WEBP } from '../../config/seo';
import {
  HOME_HERO_HEADLINE_MOBILE,
  HOME_HERO_PRIMARY_CTA,
  HOME_HERO_SUBLINE_MOBILE,
} from '../../content/homeLanding';
import { AppButtonLink } from '../mobile/AppButton';
import { MobileBrandBar } from '../layout/MobileBrandBar';

interface HomeMobileLaunchProps {
  joinHref: string;
}

/** Guest mobile hero — brand top-pinned; headline block in lower third. See docs/LANDING.md */
export const HomeMobileLaunch = ({ joinHref }: HomeMobileLaunchProps) => (
  <section className="home-launch md:hidden" aria-label="Welcome">
    <picture className="home-launch-media" aria-hidden>
      <source srcSet={HOME_HERO_IMAGE_WEBP} type="image/webp" />
      <img
        src={HOME_HERO_IMAGE_JPEG}
        alt=""
        decoding="async"
        className="home-launch-photo"
        {...({ fetchpriority: 'high' } as React.ImgHTMLAttributes<HTMLImageElement>)}
      />
    </picture>
    <div className="landing-hero-overlay-r" aria-hidden />
    <div className="landing-hero-overlay-t" aria-hidden />
    <div className="home-launch-scrim" aria-hidden />

    <div className="home-launch-body">
      <header className="home-launch-brand">
        <MobileBrandBar
          tone="light"
          menuVariant="landingJoin"
          joinHref={joinHref}
          compactBrand
        />
      </header>

      <div className="home-launch-message">
        <h1 className="landing-hero-headline">{HOME_HERO_HEADLINE_MOBILE}</h1>
        <p className="home-launch-subline">{HOME_HERO_SUBLINE_MOBILE}</p>
        <AppButtonLink to={EXPLORE_MAP_PATH} fullWidth className="home-launch-cta">
          {HOME_HERO_PRIMARY_CTA}
        </AppButtonLink>
      </div>
    </div>
  </section>
);
