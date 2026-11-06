import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { PRODUCT_JOIN_CTA } from '../../content/productNorthStar';
import {
  EXPLORE_GUEST_MAP_PREVIEW_CTA_SUFFIX,
  EXPLORE_GUEST_MAP_PREVIEW_LEAD,
} from '../exploreBrowseTaxonomy';
import { buildAuthGateUrls } from '../../utils/authReturnContext';
import { EXPLORE_MOBILE_MAP_CHROME } from '../../config/exploreTheme';

type Props = {
  onDismiss: () => void;
};

/** Guest map catalog preview — centered below filter chrome, opaque for readability. */
export const ExploreGuestMapPreviewNotice = ({ onDismiss }: Props) => {
  const location = useLocation();
  const returnPath = `${location.pathname}${location.search}`;
  const { signInHref, signUpHref } = buildAuthGateUrls(location, { returnPath });

  const authLinkClass = 'explore-guest-map-preview-banner__link';

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-[3100] flex justify-center px-4 ${EXPLORE_MOBILE_MAP_CHROME.noticeTop} lg:top-[8.75rem]`}
    >
      <div
        role="status"
        className="explore-guest-map-preview-banner pointer-events-auto relative w-full max-w-md px-4 py-3 pr-11"
      >
        <p className="text-center text-[13px] leading-snug">
          <span className="explore-guest-map-preview-banner__lead block">{EXPLORE_GUEST_MAP_PREVIEW_LEAD}</span>
          <span className="explore-guest-map-preview-banner__cta mt-1.5 block font-semibold">
            <Link to={signUpHref} className={authLinkClass}>
              {PRODUCT_JOIN_CTA}
            </Link>
            {' or '}
            <Link to={signInHref} className={authLinkClass}>
              log in
            </Link>{' '}
            {EXPLORE_GUEST_MAP_PREVIEW_CTA_SUFFIX}
          </span>
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="explore-guest-map-preview-banner__dismiss absolute right-2 top-2 rounded-lg p-1.5"
          aria-label="Dismiss preview notice"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
};
