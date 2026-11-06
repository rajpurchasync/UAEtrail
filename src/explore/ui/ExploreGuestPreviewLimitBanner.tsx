import { Link, useLocation } from 'react-router-dom';
import { PRODUCT_JOIN_CTA } from '../../content/productNorthStar';
import { EXPLORE_GUEST_MAP_PREVIEW_MAX_MATCHES } from '../exploreBrowseTaxonomy';
import { buildAuthGateUrls } from '../../utils/authReturnContext';
import { EXPLORE_MOBILE_MAP_CHROME } from '../../config/exploreTheme';

/** Map-top banner after guest preview view limit (map stays clickable). */
export const ExploreGuestPreviewLimitBanner = () => {
  const location = useLocation();
  const returnPath = `${location.pathname}${location.search}`;
  const { signInHref, signUpHref } = buildAuthGateUrls(location, { returnPath });

  const authLinkClass = 'explore-guest-map-preview-banner__link font-semibold';

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-[3100] flex justify-center px-4 ${EXPLORE_MOBILE_MAP_CHROME.noticeTop} lg:top-[8.75rem]`}
    >
      <div
        role="status"
        className="explore-guest-map-preview-banner pointer-events-auto w-full max-w-lg px-4 py-3 text-center text-[13px] leading-snug"
      >
        <p>
          <span className="explore-guest-map-preview-banner__lead block font-medium">
            You&apos;ve viewed {EXPLORE_GUEST_MAP_PREVIEW_MAX_MATCHES} plans this visit.
          </span>
          <span className="explore-guest-map-preview-banner__cta mt-1.5 block">
            <Link to={signUpHref} className={authLinkClass}>
              {PRODUCT_JOIN_CTA}
            </Link>
            {' or '}
            <Link to={signInHref} className={authLinkClass}>
              log in
            </Link>{' '}
            to open more outings, search, and the full map.
          </span>
        </p>
      </div>
    </div>
  );
};
