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

  return (
    <div
      role="status"
      className={`absolute left-4 right-4 top-3 z-[1150] rounded-2xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 shadow lg:top-4 ${EXPLORE_MOBILE_MAP_CHROME.noticeTop}`}
    >
      <p className="leading-snug">
        You&apos;ve viewed {EXPLORE_GUEST_MAP_PREVIEW_MAX_MATCHES} plans this visit.{' '}
        <Link to={signUpHref} className="font-semibold text-emerald-800 underline underline-offset-2">
          {PRODUCT_JOIN_CTA}
        </Link>{' '}
        or{' '}
        <Link to={signInHref} className="font-semibold text-emerald-800 underline underline-offset-2">
          log in
        </Link>{' '}
        to open more outings, search, and the full map.
      </p>
    </div>
  );
};
